"""ReviewMitra worker poller.

Watches worker/jobs/ for job JSON files written by the Next.js app
(src/lib/worker-queue.ts) and processes them one at a time with
gmaps_worker.py. A job is a JSON file like:

  {
    "id": "job_xxx", "type": "google_reply",
    "businessUrl": "https://share.google/Rd7mruMQjwTihYs01",
    "reviewId": "<db review id>", "externalReviewId": "...",
    "reviewerName": "Aarav Sharma", "reviewSnippet": "great biryani",
    "replyText": "Thank you! ...", "dryRun": true,
    "status": "queued" | "processing" | "completed" | "failed",
    "result": {...}, "error": "...",
    "replyDbId": "<ReviewReply row id or null>"
  }

The poller updates the job file in place. If APP_BASE_URL is set it also
POSTs the outcome to /api/worker/jobs/<id>/result so the Next.js app can
update the ReviewReply row (posted / failed). If the app is not reachable,
the result stays in the job file and the app picks it up on the next
status read -- nothing is lost.

Run:  worker/.venv/bin/python worker/run_worker.py [--once] [--config worker/config.json]
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
JOBS_DIR = os.path.join(HERE, "jobs")
VENV_PY = os.path.join(HERE, ".venv", "bin", "python")
WORKER_PY = os.path.join(HERE, "gmaps_worker.py")


def log(msg: str) -> None:
    print(f"[run-worker] {msg}", flush=True)


def load_config(path: str | None) -> dict:
    cfg: dict = {}
    if path and os.path.exists(path):
        with open(path) as f:
            cfg = json.load(f)
    return cfg


def ensure_local_proxy(cfg: dict) -> None:
    """Start worker/local_proxy.py if the VM needs it.

    Chrome cannot use the VM's authenticated egress proxy directly, so the
    worker talks to a forwarder on 127.0.0.1:8899 instead (see
    worker/local_proxy.py). If an egress proxy is present in the environment
    and nothing is listening on the local port yet, start the forwarder as a
    child process and point the worker at it via REVIEWMITRA_LOCAL_PROXY.
    """
    if os.environ.get("REVIEWMITRA_LOCAL_PROXY"):
        return
    has_egress = any(os.environ.get(v) for v in ("https_proxy", "HTTPS_PROXY", "http_proxy", "HTTP_PROXY"))
    if not has_egress:
        return
    import socket as _socket

    port = int(cfg.get("local_proxy_port", 8899))
    probe = _socket.socket()
    try:
        probe.connect(("127.0.0.1", port))
        probe.close()
        log(f"local proxy already listening on 127.0.0.1:{port}")
    except OSError:
        proxy_py = os.path.join(HERE, "local_proxy.py")
        subprocess.Popen(
            [sys.executable, proxy_py, "--port", str(port)],
            stdout=open(os.path.join(HERE, "logs-local-proxy.log"), "ab"),
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
        log(f"started local proxy on 127.0.0.1:{port}")
        time.sleep(2)
    os.environ["REVIEWMITRA_LOCAL_PROXY"] = f"http://127.0.0.1:{port}"


def read_job(path: str) -> dict:
    with open(path) as f:
        return json.load(f)


def write_job(path: str, job: dict) -> None:
    job["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(job, f, indent=2, ensure_ascii=False)
    os.replace(tmp, path)


def report_to_app(app_base_url: str, job: dict) -> None:
    if not app_base_url:
        return
    url = f"{app_base_url.rstrip('/')}/api/worker/jobs/{job['id']}/result"
    body = json.dumps(
        {
            "status": job["status"],
            "success": bool(job.get("result", {}).get("ok")),
            "verified": bool(job.get("result", {}).get("verified_on_page"))
            or bool(job.get("result", {}).get("ok") and not job.get("dryRun")),
            "dryRun": bool(job.get("dryRun")),
            "error": job.get("error"),
            "detail": job.get("result"),
        }
    ).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            log(f"reported job {job['id']} to app ({resp.status})")
    except Exception as exc:
        log(f"could not report job {job['id']} to app ({exc}); result stays in job file")


def process_job(job_path: str, cfg: dict) -> None:
    job = read_job(job_path)
    if job.get("status") != "queued":
        return
    job["status"] = "processing"
    job["startedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    write_job(job_path, job)
    log(f"processing {job['id']} ({job.get('type')}, dry_run={job.get('dryRun')})")

    profile_dir = cfg.get("profile_dir") or job.get("profileDir")
    headless = cfg.get("headless", True)
    python = VENV_PY if os.path.exists(VENV_PY) else sys.executable

    cmd = [python, WORKER_PY]
    if job.get("type") == "google_list_reviews":
        cmd += ["list-reviews", "--business-url", job.get("businessUrl", "")]
        if job.get("maxReviews"):
            cmd += ["--max-reviews", str(job["maxReviews"])]
    else:  # google_reply
        cmd += [
            "post-reply",
            "--business-url", job.get("businessUrl", ""),
            "--review-author", job.get("reviewerName", ""),
            "--review-snippet", job.get("reviewSnippet", ""),
            "--reply-text", job.get("replyText", ""),
        ]
        if job.get("dryRun"):
            cmd += ["--dry-run"]
    if profile_dir:
        cmd += ["--profile-dir", profile_dir]
    if not headless:
        cmd += ["--no-headless"]

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        out = (proc.stdout or "").strip()
        result = None
        for line in reversed(out.splitlines()):
            line = line.strip()
            if line.startswith("{"):
                try:
                    result = json.loads(line)
                    break
                except Exception:
                    continue
        if result is None:
            result = {"ok": False, "error": "worker produced no JSON result", "stdout": out[-2000:], "stderr": proc.stderr[-2000:]}
        job["result"] = result
        job["worker_stdout_tail"] = out[-2000:]
        job["worker_stderr_tail"] = (proc.stderr or "")[-2000:]
        job["status"] = "completed" if (result.get("ok") and proc.returncode == 0) else "failed"
        if job["status"] == "failed" and not job.get("error"):
            job["error"] = result.get("error") or f"worker exited {proc.returncode}"
    except subprocess.TimeoutExpired:
        job["status"] = "failed"
        job["error"] = "worker timed out after 600s"
    except Exception as exc:
        job["status"] = "failed"
        job["error"] = str(exc)

    job["finishedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    write_job(job_path, job)
    log(f"job {job['id']} -> {job['status']}: {job.get('error') or 'ok'}")
    report_to_app(cfg.get("app_base_url", "http://localhost:3000"), job)


def main() -> int:
    ap = argparse.ArgumentParser(description="ReviewMitra SeleniumBase job poller")
    ap.add_argument("--once", action="store_true", help="process queued jobs once, then exit")
    ap.add_argument("--config", default=os.path.join(HERE, "config.json"))
    ap.add_argument("--jobs-dir", default=JOBS_DIR)
    args = ap.parse_args()

    cfg = load_config(args.config if os.path.exists(args.config) else None)
    jobs_dir = cfg.get("jobs_dir", args.jobs_dir)
    os.makedirs(jobs_dir, exist_ok=True)
    ensure_local_proxy(cfg)
    interval = int(cfg.get("poll_interval_seconds", 10))
    log(f"watching {jobs_dir} every {interval}s (profile: {cfg.get('profile_dir') or 'none (read-only)'})")

    while True:
        try:
            for name in sorted(os.listdir(jobs_dir)):
                if not name.endswith(".json"):
                    continue
                path = os.path.join(jobs_dir, name)
                try:
                    if read_job(path).get("status") == "queued":
                        process_job(path, cfg)
                except Exception as exc:
                    log(f"skipping unreadable job file {name}: {exc}")
        except Exception as exc:
            log(f"poll error: {exc}")
        if args.once:
            return 0
        time.sleep(interval)


if __name__ == "__main__":
    sys.exit(main())
