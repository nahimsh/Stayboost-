# StayBoost AI service (FastAPI). Build context = the REPOSITORY ROOT (Railway
# default), so paths are prefixed with services/ai/.
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
COPY services/ai/requirements.txt ./
RUN pip install -r requirements.txt
COPY services/ai/app ./app
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
