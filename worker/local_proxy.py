"""Local authenticating forward proxy (dev-only, stdlib only).

Problem: this VM reaches the internet through an egress proxy that requires
``Proxy-Authorization``. curl/pip/npm read the credentials from the
environment, but Chrome ignores proxy credentials from env vars / proxy
URLs (Chromium bug 16709) and SeleniumBase's proxy-auth extension does not
reliably load in headless UC mode here, so Chrome's CONNECT requests fail
(ERR_TUNNEL_CONNECTION_FAILED).

Fix: this tiny forwarder listens on 127.0.0.1 (no auth needed locally) and
adds the ``Proxy-Authorization`` header itself when talking to the upstream
egress proxy. Point Chrome at it with ``--proxy-server=http://127.0.0.1:8899``.

The upstream proxy URL (including its credential) is read ONLY from the
environment (``https_proxy`` / ``HTTPS_PROXY`` / ``http_proxy`` /
``HTTP_PROXY``) and is NEVER logged or written to disk.

Usage:
    python3 worker/local_proxy.py [--port 8899]
    # then, in another shell:
    REVIEWMITRA_LOCAL_PROXY=http://127.0.0.1:8899 \\
        worker/.venv/bin/python worker/gmaps_worker.py list-reviews ...

``run_worker.py`` starts this automatically when it sees an authenticated
egress proxy in the environment.
"""

from __future__ import annotations

import base64
import os
import select
import socket
import socketserver
import sys
import threading
import urllib.parse

LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = 8899
BUF = 65536


def log(msg: str) -> None:
    print(f"[local-proxy] {msg}", flush=True)


def upstream_from_env() -> tuple[str, int, str]:
    for var in ("https_proxy", "HTTPS_PROXY", "http_proxy", "HTTP_PROXY"):
        raw = os.environ.get(var)
        if raw:
            u = urllib.parse.urlparse(raw)
            host, port = u.hostname, u.port or 3128
            auth = ""
            if u.username:
                token = base64.b64encode(
                    f"{u.username}:{u.password or ''}".encode()
                ).decode()
                auth = f"Basic {token}"
            if host and port:
                return host, port, auth
    raise SystemExit("no egress proxy found in https_proxy/HTTP_PROXY env vars")


UP_HOST, UP_PORT, UP_AUTH = upstream_from_env()


def splice(a: socket.socket, b: socket.socket) -> None:
    socks = [a, b]
    try:
        while True:
            r, _, _ = select.select(socks, [], [], 60)
            if not r:
                return
            for s in r:
                data = s.recv(BUF)
                if not data:
                    return
                (b if s is a else a).sendall(data)
    except OSError:
        return
    finally:
        for s in socks:
            try:
                s.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            s.close()


class Handler(socketserver.BaseRequestHandler):
    def handle(self) -> None:
        client = self.request
        client.settimeout(120)
        try:
            head = self._read_head(client)
            if not head:
                return
            first, headers = head
            method, target, _version = first.split(" ", 2)
            if method.upper() == "CONNECT":
                self._handle_connect(client, target)
            else:
                self._handle_plain(client, first, headers)
        except Exception as exc:
            log(f"handler error: {exc}")
        finally:
            try:
                client.close()
            except OSError:
                pass

    def _read_head(self, sock: socket.socket):
        buf = b""
        while b"\r\n\r\n" not in buf and len(buf) < 65536:
            chunk = sock.recv(4096)
            if not chunk:
                return None
            buf += chunk
        head, _, _rest = buf.partition(b"\r\n\r\n")
        lines = head.decode("iso-8859-1").split("\r\n")
        return lines[0], lines[1:]

    def _handle_connect(self, client: socket.socket, target: str) -> None:
        host, _, port = target.partition(":")
        port = int(port or 443)
        upstream = socket.create_connection((UP_HOST, UP_PORT), timeout=30)
        upstream.settimeout(120)
        req = (
            f"CONNECT {host}:{port} HTTP/1.1\r\n"
            f"Host: {host}:{port}\r\n"
            f"Proxy-Authorization: {UP_AUTH}\r\n"
            "Proxy-Connection: keep-alive\r\n\r\n"
        )
        upstream.sendall(req.encode())
        resp = b""
        while b"\r\n\r\n" not in resp:
            chunk = upstream.recv(4096)
            if not chunk:
                client.sendall(b"HTTP/1.1 502 Bad Gateway\r\n\r\n")
                upstream.close()
                return
            resp += chunk
        status = resp.split(b"\r\n", 1)[0].decode("iso-8859-1", "replace")
        if " 200 " not in f" {status} ":
            log(f"CONNECT {host}:{port} -> upstream {status}")
            client.sendall(b"HTTP/1.1 502 Bad Gateway\r\n\r\n")
            upstream.close()
            return
        log(f"CONNECT {host}:{port} -> 200")
        client.sendall(b"HTTP/1.1 200 Connection Established\r\n\r\n")
        splice(client, upstream)

    def _handle_plain(self, client: socket.socket, first: str, headers: list[str]) -> None:
        # Plain-HTTP absolute-form requests (rare for Chrome, which uses
        # CONNECT for https). Forward with auth added.
        upstream = socket.create_connection((UP_HOST, UP_PORT), timeout=30)
        upstream.settimeout(120)
        out = [first]
        seen_auth = False
        for h in headers:
            if h.lower().startswith("proxy-authorization:"):
                seen_auth = True
            out.append(h)
        if not seen_auth:
            out.append(f"Proxy-Authorization: {UP_AUTH}")
        upstream.sendall(("\r\n".join(out) + "\r\n\r\n").encode("iso-8859-1"))
        splice(client, upstream)


class Server(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True


def main() -> int:
    port = int(sys.argv[sys.argv.index("--port") + 1]) if "--port" in sys.argv else LISTEN_PORT
    # Hide the credential: only the host is logged, never user/pass.
    log(f"listening on {LISTEN_HOST}:{port}, upstream {UP_HOST}:{UP_PORT}")
    with Server((LISTEN_HOST, port), Handler) as srv:
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
