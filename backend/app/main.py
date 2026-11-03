"""FastAPI entrypoint for the FinNews retrieval service.

Run locally:
    uvicorn app.main:app --reload --port 8000
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config, deps
from .routers import search

logger = logging.getLogger("finnews")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm models + indexes so the first user request isn't slow.
    logger.info("Warming up models and indexes...")
    try:
        deps.warm_up()
        logger.info("Warm-up complete (collection count=%s)", deps.collection_count())
    except Exception as exc:  # don't block startup if weights/corpus missing
        logger.warning("Warm-up incomplete: %s", exc)
    yield


app = FastAPI(
    title="FinNews Retrieval API",
    description="Semantic + hybrid + reranked search over financial news.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "finnews", "docs": "/docs", "health": "/health"}
