"""FastAPI application initialization."""
from fastapi import FastAPI
from app.routes.ledger import ledger_bp
from app.routes.policy import policy_bp

def create_app() -> FastAPI:
    app = FastAPI(title="Insurance API", version="1.0.0")
    app.include_router(ledger_bp, prefix="/api/v1")
    app.include_router(policy_bp, prefix="/api/v1")
    return app

app = create_app()
