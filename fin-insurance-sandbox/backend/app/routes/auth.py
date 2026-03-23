"""
Authentication endpoints for user registration and login.

Provides RESTful endpoints for user account creation and authentication
with role-based access control for the insurance platform.
"""

from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models.user import User

# Create Blueprint for authentication routes
auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')

def _validate_registration_data(data):
    """
    Validate registration request data.

    Args:
        data: Dictionary containing registration form data

    Returns:
        tuple: (is_valid, error_message)
    """
    required_fields = ['username', 'email', 'password', 'role']

    # Check required fields
    for field in required_fields:
        if not data.get(field):
            return False, f"Missing required field: {field}"

    # Validate password length
    if len(data.get('password', '')) < 8:
        return False, "Password must be at least 8 characters"

    # Validate role
    valid_roles = ['admin', 'underwriter', 'agent', 'customer']
    if data.get('role') not in valid_roles:
        return False, f"Invalid role. Must be one of: {', '.join(valid_roles)}"

    return True, None

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user account.

    Request Body:
        {
            "username": "string",
            "email": "string",
            "password": "string",
            "role": "admin|underwriter|agent|customer"
        }

    Returns:
        201: {"token": "string", "user": {user_object}}
    """
    try:
        # Get JSON payload
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request must be JSON'}), 400

        # Validate input data
        is_valid, error_msg = _validate_registration_data(data)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        # Create new user
        new_user = User(
            username=data['username'],
            email=data['email'].lower().strip(),
            password_hash=generate_password_hash(data['password']),
            role=data['role']
        )

        # Save to database
        db.session.add(new_user)
        db.session.commit()

        # Return success response (stub token for now)
        return jsonify({
            'token': f"stub_token_{new_user.id}",
            'user': new_user.to_dict()
        }), 201

    except IntegrityError as e:
        # Handle duplicate email/username
        db.session.rollback()
        if 'email' in str(e.orig):
            return jsonify({'error': 'Email already registered'}), 409
        elif 'username' in str(e.orig):
            return jsonify({'error': 'Username already taken'}), 409
        else:
            return jsonify({'error': 'Database integrity error'}), 409
    except Exception as e:
        # Handle any other database errors
        db.session.rollback()
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate user and return access token.

    Request Body:
        {
            "email": "string",
            "password": "string"
        }

    Returns:
        200: {"token": "string", "user": {user_object}}
    """
    try:
        # Get JSON payload
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request must be JSON'}), 400

        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400

        # Find user by email
        email = data['email'].lower().strip()
        user = User.query.filter_by(email=email).first()

        # Verify user exists and password matches
        if not user or not check_password_hash(user.password_hash, data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401

        # Return success response (stub token for now)
        return jsonify({
            'token': f"stub_token_{user.id}",
            'user': user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'error': 'Login failed'}), 500
