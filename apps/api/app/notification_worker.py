import asyncio
import logging

import httpx

from app.database import session_factory
from app.settings import settings
from app.whatsapp import dispatch_one

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
POLL_INTERVAL_SECONDS = 5


async def run() -> None:
    if not settings.whatsapp_is_configured:
        logger.warning(
            "WhatsApp delivery is not configured; queued notifications will remain pending"
        )
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0)) as client:
        while True:
            try:
                if await dispatch_one(session_factory, client):
                    continue
                await asyncio.sleep(POLL_INTERVAL_SECONDS)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("WhatsApp notification worker encountered an unexpected error")
                await asyncio.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    asyncio.run(run())
