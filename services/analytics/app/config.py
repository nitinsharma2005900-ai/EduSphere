from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import os

class Settings(BaseSettings):
    APP_NAME: str = "EduSphere Analytics & Grading Microservice"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, validation_alias="EDUSPHERE_DEBUG")
    HOST: str = os.getenv("ANALYTICS_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("ANALYTICS_PORT", "8000"))
    INTERNAL_SERVICE_KEY: str = os.getenv("INTERNAL_SERVICE_KEY", "edusphere_internal_microservice_secret_key_2026_secure!")
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL", None)

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
if os.getenv("NODE_ENV") == "production" and (len(settings.INTERNAL_SERVICE_KEY) < 32 or settings.INTERNAL_SERVICE_KEY.startswith("edusphere_")):
    raise RuntimeError("Production requires a new random INTERNAL_SERVICE_KEY")
