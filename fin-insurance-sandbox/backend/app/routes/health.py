from flask import Blueprint, jsonify

bp = Blueprint("health", __name__, url_prefix="/")

@bp.route("/health", methods=["GET"])
def health():
    try:
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
