# Agent MAXX FastAPI control-plane image

ARG PYTHON_VERSION=3.13
FROM python:${PYTHON_VERSION}-slim AS runner

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV MAXX_ENV=production
ENV MAXX_DATA_DIR=/data/maxx
ENV MAXX_HERMES_HOME=/runtime/hermes
ENV MAXX_HERMES_VENDOR_PATH=/opt/hermes-agent

WORKDIR /app

RUN useradd --create-home --uid 10001 maxx

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY maxx_bff ./maxx_bff

RUN mkdir -p /data/maxx /runtime/hermes /opt/hermes-agent && \
    chown -R maxx:maxx /app /data/maxx /runtime/hermes /opt/hermes-agent

USER maxx

EXPOSE 8010

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8010/health', timeout=5).read()" || exit 1

CMD ["uvicorn", "maxx_bff.main:app", "--host", "0.0.0.0", "--port", "8010"]
