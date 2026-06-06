from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="JoinQ Backend")
    db_host: str = Field(default="localhost", alias="DB_HOST")
    db_port: int = Field(default=5432, alias="DB_PORT")
    db_user: str = Field(default="joinq", alias="DB_USER")
    db_password: str = Field(default="joinq", alias="DB_PASSWORD")
    db_name: str = Field(default="joinq", alias="DB_NAME")
    db_sslmode: str = Field(default="disable", alias="DB_SSLMODE")
    db_sslrootcert: str | None = Field(default=None, alias="DB_SSLROOTCERT")


@lru_cache
def get_settings() -> Settings:
    return Settings()
