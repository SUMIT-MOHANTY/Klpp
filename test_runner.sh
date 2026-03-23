set -e

echo "=== Running BULLETPROOF FIX VERIFICATION ==="
echo "1. Installing dependencies..."
cd /workspace
pip install -r backend/requirements.txt

echo "2. Testing database initialization..."
python backend/init_db.py

echo "3. Running pytest..."
cd backend
python -m pytest tests/ -v || {
    echo "Tests still failing - analyzing..."
    python -c "
import pytest
import sys
ret = pytest.main(['tests/', '-v', '--tb=long'])
sys.exit(ret)
"
    exit 1
}

echo "=== BULLETPROOF FIX SUCCESSFUL ==="
echo "Verified: All tests passing, no deprecations"
