"""ReviewMitra Google Maps worker — FastAPI HTTP service.

One Chrome at a time (a global lock serialises browser jobs: a Chrome
profile cannot be used by two instances at once).

Auth: every request must carry the worker secret, either as the
`X-Worker-Secret` header or `Authorization: Bearer <secret>`. The secret
comes from the WORKER_SECRET env var; the service refuses to start
without it (fail closed — never run an unauthenticated browser worker).

Endpoints
---------
GET  /health  -> {ok, version, profileConfigured}
POST /sync    {mapsUrl} -> {business:{name,address,rating,totalReviewsShown,placeId?},
                            reviews:[{externalId,reviewerName,rating,text,dateText,ownerReply?}],
                            fetchedCount, totalReviewsShown, completenessPct, complete}
POST /reply   {mapsUrl, externalId?, reviewerName?, reviewText?, replyText, dryRun?}
              -> {posted, verified, place_url, review?, error?}

The service never logs in and never types a password. The one-time owner
login is done separately (see worker/README.md): the worker types the
email only, the owner taps Yes + the number on their phone, and the
session is saved to the persistent Chrome profile (WORKER_PROFILE_DIR).
Until that profile exists, /sync works logged-out (public reviews only —
Google shows 5 of 942) and /reply honestly reports "no Reply control".

Run locally:
  WORKER_SECRET=<secret> worker/.venv/bin/uvicorn worker.app:app --port 8000
Run in Docker: see worker/Dockerfile.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse

HERE = os.path.dirname(os.path.abspath(__file__))
VERSION = "1.0.0"

WORKER_SECRET = os.environ.get("WORKER_SECRET", "")
if not WORKER_SECRET:
    raise RuntimeError(
        "WORKER_SECRET is not set — refusing to start an unauthenticated "
        "browser worker. Set WORKER_SECRET to a long random value."
    )

PROFILE_DIR = os.environ.get("WORKER_PROFILE_DIR") or os.path.join(
    HERE, "profiles", "google-owner"
)
HEADLESS = os.environ.get("WORKER_HEADLESS", "true").lower() != "false"


def _ensure_local_proxy() -> None:
    """On this VM the egress proxy needs a local forwarder (see
    worker/local_proxy.py): Chrome cannot use the authenticated egress
    proxy directly. Mirror run_worker.py: start the forwarder on
    127.0.0.1:8899 when an egress proxy is present and nothing is
    listening there yet. On a VPS (direct internet) this is a no-op."""
    if os.environ.get("REVIEWMITRA_LOCAL_PROXY"):
        return
    if not any(os.environ.get(v) for v in ("https_proxy", "HTTPS_PROXY", "http_proxy", "HTTP_PROXY")):
        return
    import socket
    import subprocess
    import sys

    port = 8899
    probe = socket.socket()
    try:
        probe.connect(("127.0.0.1", port))
        probe.close()
    except OSError:
        subprocess.Popen(
            [sys.executable, os.path.join(HERE, "local_proxy.py"), "--port", str(port)],
            stdout=open(os.path.join(HERE, "logs-local-proxy.log"), "ab"),
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
        time.sleep(2)
    os.environ["REVIEWMITRA_LOCAL_PROXY"] = f"http://127.0.0.1:{port}"


_ensure_local_proxy()

# One browser at a time.
_BROWSER_LOCK = threading.Lock()
_EXECUTOR = ThreadPoolExecutor(max_workers=1, thread_name_prefix="gmaps-worker")

app = FastAPI(title="ReviewMitra Google Maps Worker", version=VERSION)


def _check_secret(x_worker_secret: str | None, authorization: str | None) -> None:
    supplied = x_worker_secret or ""
    if not supplied and authorization:
        parts = authorization.split(None, 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            supplied = parts[1]
    if not supplied or not hmac.compare_digest(supplied, WORKER_SECRET):
        raise HTTPException(status_code=401, detail="invalid worker secret")


def _load_worker():
    """Import gmaps_worker lazily (it inserts its own dir on sys.path)."""
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "gmaps_worker", os.path.join(HERE, "gmaps_worker.py")
    )
    mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


def _run_sync(maps_url: str) -> dict:
    mod = _load_worker()
    profile = PROFILE_DIR if os.path.isdir(PROFILE_DIR) else None
    with mod.make_sb(profile, HEADLESS) as sb:
        try:
            result = mod.sync_reviews(sb, maps_url)
            return {"ok": True, "action": "sync", **result}
        except Exception as exc:
            return {"ok": False, "action": "sync", "error": str(exc)}


def _run_reply(payload: dict) -> dict:
    mod = _load_worker()
    profile = PROFILE_DIR if os.path.isdir(PROFILE_DIR) else None
    with mod.make_sb(profile, HEADLESS) as sb:
        try:
            result = mod.post_reply_to_review(
                sb,
                payload["mapsUrl"],
                payload["replyText"],
                external_id=payload.get("externalId") or "",
                reviewer_name=payload.get("reviewerName") or "",
                review_text=payload.get("reviewText") or "",
                dry_run=bool(payload.get("dryRun")),
            )
            return {"ok": result.get("posted") or result.get("dry_run", False), "action": "post-reply", **result}
        except Exception as exc:
            return {"ok": False, "action": "post-reply", "error": str(exc)}


@app.get("/health")
def health():
    return {
        "ok": True,
        "version": VERSION,
        "profileConfigured": os.path.isdir(PROFILE_DIR),
        "profileDir": PROFILE_DIR,
        "headless": HEADLESS,
    }


@app.get("/")
def index():
    return {
        "service": "ReviewMitra Google Maps worker",
        "version": VERSION,
        "endpoints": ["GET /health", "POST /sync", "POST /reply"],
        "auth": "X-Worker-Secret header or Authorization: Bearer <WORKER_SECRET>",
    }


@app.post("/sync")
async def sync(request: Request, x_worker_secret: str | None = Header(default=None), authorization: str | None = Header(default=None)):
    _check_secret(x_worker_secret, authorization)
    body = await request.json()
    maps_url = (body.get("mapsUrl") or "").strip()
    if not maps_url:
        raise HTTPException(status_code=400, detail="mapsUrl is required")
    if not _BROWSER_LOCK.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="worker is busy with another job; retry later")
    try:
        import asyncio

        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(_EXECUTOR, _run_sync, maps_url)
        return JSONResponse(content=result)
    finally:
        _BROWSER_LOCK.release()


@app.post("/reply")
async def reply(request: Request, x_worker_secret: str | None = Header(default=None), authorization: str | None = Header(default=None)):
    _check_secret(x_worker_secret, authorization)
    body = await request.json()
    maps_url = (body.get("mapsUrl") or "").strip()
    reply_text = (body.get("replyText") or "").strip()
    if not maps_url or not reply_text:
        raise HTTPException(status_code=400, detail="mapsUrl and replyText are required")
    if not (body.get("externalId") or body.get("reviewerName") or body.get("reviewText")):
        raise HTTPException(
            status_code=400,
            detail="identify the review with externalId or reviewerName+reviewText",
        )
    if not _BROWSER_LOCK.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="worker is busy with another job; retry later")
    try:
        import asyncio

        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(_EXECUTOR, _run_reply, body)
        return JSONResponse(content=result)
    finally:
        _BROWSER_LOCK.release()
