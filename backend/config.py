from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_base_url: str = ""
    service_name: str = "rpa-really-passports"
    client_id: str = ""
    client_secret: str = ""
    database_path: str = "data/passport_checks.db"
    poll_interval_sec: int = 5
    poll_timeout_sec: int = 120

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
