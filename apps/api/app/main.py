from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.database import check_database_connection, engine
from app.catalog_routes import router as catalog_router
from app.order_routes import router as order_router
from app.settings import settings
from app.upload_routes import router as upload_router
from app.admin_routes import router as admin_router
from app.auth_routes import router as auth_router
from app.product_image_routes import router as product_image_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    yield
    await engine.dispose()


app = FastAPI(
    title="Fast Print Sahline API",
    description="API du site Fast Print Sahline",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.admin_session_secret,
    session_cookie="fastprint_admin_session",
    max_age=settings.admin_session_max_age_seconds,
    same_site="lax",
    https_only=settings.admin_cookie_secure,
)

app.include_router(catalog_router, prefix="/api/v1")
app.include_router(order_router, prefix="/api/v1")
app.include_router(upload_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(product_image_router, prefix="/api/v1")


@app.get("/health/live", tags=["health"])
async def liveness() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"])
async def readiness() -> dict[str, str]:
    try:
        await check_database_connection()
    except (SQLAlchemyError, OSError) as exc:
        raise HTTPException(status_code=503, detail="Database is unavailable") from exc
    return {"status": "ok", "database": "connected"}
