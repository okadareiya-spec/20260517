from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./dev.db"
    RESEND_API_KEY: str = ""
    REMINDER_BATCH_INTERVAL: int = 60
    FRONTEND_URL: str = "*"

    model_config = {"env_file": ".env"}

    @property
    def db_url(self) -> str:
        return self.DATABASE_URL.replace("postgres://", "postgresql://", 1)


settings = Settings()
