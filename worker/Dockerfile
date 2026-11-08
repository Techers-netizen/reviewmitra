# ReviewMitra Google Maps worker — FastAPI service in Docker.
#
# Vercel cannot run Chrome, so this worker runs separately (local Docker
# now, VPS later) and the Next.js app calls it via WORKER_URL.
#
# Build:  docker build -f worker/Dockerfile -t reviewmitra-worker .
# Run:    docker run -d --name reviewmitra-worker -p 8000:8000 \
#           -e WORKER_SECRET=<long-random-secret> \
#           -v reviewmitra-profile:/app/worker/profiles \
#           reviewmitra-worker
#
# The Chrome profile (with the owner's Google login) lives in the
# `reviewmitra-profile` volume so it survives container restarts.
# First run: do the one-time login (see worker/README.md) before syncing
# replies — until then /sync works logged-out (public reviews only) and
# /reply honestly reports "no Reply control".
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System libraries headless Chrome needs.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation \
    libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 \
    libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc-s1 libglib2.0-0 \
    libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
    libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
    libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
    libxss1 libxtst6 lsb-release wget xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY worker/requirements.txt worker/requirements.txt
RUN pip install -r worker/requirements.txt
COPY worker/ ./worker/

# Pre-download the Chrome-for-Testing binary SeleniumBase UC mode uses,
# so the first request does not pay the download.
RUN python -c "from seleniumbase import SB; SB(uc=True, headless=True, test=True).__enter__().__exit__()" || true

ENV WORKER_PORT=8000
EXPOSE 8000
VOLUME ["/app/worker/profiles"]
CMD ["sh", "-c", "uvicorn worker.app:app --host 0.0.0.0 --port ${WORKER_PORT:-8000}"]
