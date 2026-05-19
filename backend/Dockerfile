# Agent MAXX FastAPI control-plane image

ARG PYTHON_VERSION=3.13
FROM python:${PYTHON_VERSION}-slim AS runner
ARG HERMES_AGENT_REPO=https://github.com/NousResearch/hermes-agent.git
ARG HERMES_AGENT_REF=main

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV MAXX_ENV=production
ENV MAXX_DATA_DIR=/data/maxx
ENV MAXX_RUNTIME_HOME=/runtime/maxx
ENV MAXX_RUNTIME_VENDOR_PATH=/opt/agent-maxx-runtime

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends git ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 10001 maxx

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

RUN git clone --depth=1 --branch "$HERMES_AGENT_REF" "$HERMES_AGENT_REPO" /opt/agent-maxx-runtime && \
    pip install --no-cache-dir -e /opt/agent-maxx-runtime

COPY maxx_bff ./maxx_bff

RUN mkdir -p /data/maxx /runtime/maxx /opt/agent-maxx-runtime && \
    chown -R maxx:maxx /app /data/maxx /runtime/maxx /opt/agent-maxx-runtime

USER maxx

EXPOSE 8010

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8010/health', timeout=5).read()" || exit 1

CMD ["uvicorn", "maxx_bff.main:app", "--host", "0.0.0.0", "--port", "8010"]
