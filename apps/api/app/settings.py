import re
from typing import ClassVar

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://fastprint:fastprint@localhost:5432/fastprint"
    cors_origins: list[str] = ["http://localhost:3000"]
    file_storage_path: str = "/var/lib/fastprint/uploads"
    product_image_storage_path: str = "/var/lib/fastprint/product-images"
    max_upload_size_bytes: int = 25 * 1024 * 1024
    admin_username: str = "admin"
    admin_password_hash: str = ""
    admin_session_secret: str = ""
    admin_cookie_secure: bool = True
    admin_session_max_age_seconds: int = 28800
    whatsapp_access_token: str = ""
    whatsapp_phone_number_id: str = ""
    whatsapp_api_version: str = ""
    whatsapp_template_fr: str = ""
    whatsapp_template_ar: str = ""
    whatsapp_template_en: str = ""
    whatsapp_max_attempts: int = 8
    whatsapp_templates: ClassVar[dict[str, str]] = {
        "fr": "whatsapp_template_fr",
        "ar": "whatsapp_template_ar",
        "en": "whatsapp_template_en",
    }

    @property
    def whatsapp_is_configured(self) -> bool:
        return all(
            (
                self.whatsapp_access_token,
                self.whatsapp_phone_number_id,
                re.fullmatch(r"v\d+\.\d+", self.whatsapp_api_version),
                *(
                    getattr(self, field)
                    for field in self.whatsapp_templates.values()
                ),
            )
        )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
