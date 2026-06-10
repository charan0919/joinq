from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DB_HOST: str
    DB_PORT: int = 5432
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    DB_SSLMODE: str = "disable"
    DB_SSLROOTCERT: str = ""

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # App
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    # These lowercase properties match what db.py expects
    @property
    def db_host(self): return self.DB_HOST
    @property
    def db_port(self): return self.DB_PORT
    @property
    def db_name(self): return self.DB_NAME
    @property
    def db_user(self): return self.DB_USER
    @property
    def db_password(self): return self.DB_PASSWORD
    @property
    def db_sslmode(self): return self.DB_SSLMODE
    @property
    def db_sslrootcert(self): return self.DB_SSLROOTCERT

    class Config:
        env_file = ".env"

settings = Settings()