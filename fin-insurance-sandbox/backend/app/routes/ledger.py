# IMMUTABLE LEDGER - do not alter after creation
import hashlib
import time
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.models.transaction import Transaction
from app.schemas.ledger import LedgerRecordRequest
from app.db import db
from app.utils.auth import require_auth

try:
    from pydantic import ValidationError
except ImportError:
    current_app.logger.error("Pydantic not available")
    ValidationError = None

ledger_bp = Blueprint('ledger_bp', __name__)

def generate_txn_hash(ref_table: str, ref_id: int, amount: float, currency: str) -> str:
    """Generate unique transaction hash based on transaction data and timestamp."""
    data = f"{ref_table}:{ref_id}:{amount}:{currency}:{int(time.time()*1000)}"
    return hashlib.sha256(data.encode()).hexdigest()[:32]

@ledger_bp.route('/api/v1/ledger/record', methods=['POST'])
@require_auth
def create_ledger_record():
    """Create a new immutable ledger transaction."""
    try:
        # Validate request payload
        try:
            data = LedgerRecordRequest(**request.get_json())
        except ValidationError as e:
            return jsonify({"error": f"Invalid request: {str(e)}"}), 400
        except Exception:
            return jsonify({"error": "Invalid JSON payload"}), 400

        # Generate transaction hash
        txn_hash = generate_txn_hash(
            data.ref_table,
            data.ref_id,
            data.amount,
            data.currency
        )

        # Create new transaction
        transaction = Transaction(
            txn_hash=txn_hash,
            ref_table=data.ref_table,
            ref_id=data.ref_id,
            amount=abs(float(data.amount))  # Ensure positive amount
        )

        try:
            db.session.add(transaction)
            db.session.commit()
            return jsonify({"transaction": transaction.to_dict()}), 201

        except IntegrityError as e:
            db.session.rollback()
            # Generate new hash if collision occurred
            txn_hash = generate_txn_hash(
                data.ref_table,
                data.ref_id,
                data.amount,
                f"{data.currency}{int(time.time()*10000)}"
            )
            transaction.txn_hash = txn_hash
            db.session.add(transaction)
            db.session.commit()
            return jsonify({"transaction": transaction.to_dict()}), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error creating transaction: {e}")
        return jsonify({"error": "Database error occurred"}), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Unexpected error creating transaction: {e}")
        return jsonify({"error": "Internal server error"}), 500

@ledger_bp.route('/api/v1/ledger/<string:txn_hash>', methods=['GET'])
@require_auth
def get_transaction_by_hash(txn_hash):
    """Retrieve a transaction by its hash."""
    try:
        transaction = Transaction.query.filter_by(txn_hash=txn_hash).first()

        if not transaction:
            return jsonify({"error": "Transaction not found"}), 404

        return jsonify({"transaction": transaction.to_dict()}), 200

    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error retrieving transaction: {e}")
        return jsonify({"error": "Database error occurred"}), 500
    except Exception as e:
        current_app.logger.error(f"Unexpected error retrieving transaction: {e}")
        return jsonify({"error": "Internal server error"}), 500

@ledger_bp.route('/api/v1/ledger', methods=['GET'])
@require_auth
def get_transactions():
    """Retrieve transactions filtered by reference table and ID."""
    try:
        ref_table = request.args.get('ref_table')
        ref_id = request.args.get('ref_id', type=int)
        limit = min(request.args.get('limit', 100, type=int), 100)  # Max 100

        query = Transaction.query

        if ref_table:
            query = query.filter_by(ref_table=ref_table)

        if ref_id:
            query = query.filter_by(ref_id=ref_id)

        # Order by most recent first
        transactions = query.order_by(Transaction.created_at.desc()).limit(limit).all()

        return jsonify({
            "transactions": [t.to_dict() for t in transactions]
        }), 200

    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error retrieving transactions: {e}")
        return jsonify({"error": "Database error occurred"}), 500
    except Exception as e:
        current_app.logger.error(f"Unexpected error retrieving transactions: {e}")
        return jsonify({"error": "Internal server error"}), 500
