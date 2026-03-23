from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config.from_prefixed_env()
    app.config.setdefault("SQLALCHEMY_DATABASE_URI", "postgresql://postgres:postgres@db:5432/fin_insurance")
    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)

    db.init_app(app)

    with app.app_context():
        from .routes import health
        app.register_blueprint(health.bp)

    return app
