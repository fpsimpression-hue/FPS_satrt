import time
from threading import Lock
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pwdlib import PasswordHash

from app.schemas import AdminLoginIn, AdminSessionOut
from app.settings import settings

router = APIRouter(prefix="/admin/auth", tags=["admin authentication"])
password_hasher = PasswordHash.recommended()
login_attempts: dict[str, list[float]] = {}
login_attempts_lock = Lock()
LOGIN_WINDOW_SECONDS = 15 * 60
MAX_LOGIN_ATTEMPTS = 5


def verify_admin_origin(request: Request) -> None:
    if request.headers.get("origin") not in settings.cors_origins:
        raise HTTPException(status_code=403, detail="Request origin is not allowed")


async def require_admin(request: Request) -> str:
    username = request.session.get("admin_username")
    if not isinstance(username, str) or username != settings.admin_username:
        raise HTTPException(status_code=401, detail="Administrator authentication required")
    return username


@router.post("/login", response_model=AdminSessionOut)
async def login(
    request: Request,
    credentials: AdminLoginIn,
) -> AdminSessionOut:
    verify_admin_origin(request)
    if not settings.admin_password_hash or not settings.admin_session_secret:
        raise HTTPException(status_code=503, detail="Administrator access is not configured")

    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    with login_attempts_lock:
        attempts = [
            timestamp
            for timestamp in login_attempts.get(client_ip, [])
            if now - timestamp < LOGIN_WINDOW_SECONDS
        ]
        if len(attempts) >= MAX_LOGIN_ATTEMPTS:
            raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")

    valid_password = password_hasher.verify(
        credentials.password,
        settings.admin_password_hash,
    )
    if credentials.username != settings.admin_username or not valid_password:
        with login_attempts_lock:
            attempts.append(now)
            login_attempts[client_ip] = attempts
        raise HTTPException(status_code=401, detail="Invalid username or password")

    with login_attempts_lock:
        login_attempts.pop(client_ip, None)
    request.session.clear()
    request.session["admin_username"] = settings.admin_username
    return AdminSessionOut(username=settings.admin_username)


@router.get("/me", response_model=AdminSessionOut)
async def current_admin(username: Annotated[str, Depends(require_admin)]) -> AdminSessionOut:
    return AdminSessionOut(username=username)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    _: Annotated[str, Depends(require_admin)],
) -> Response:
    verify_admin_origin(request)
    request.session.clear()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
