import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import init_db

if __name__ == "__main__":
    print("Initializing database...")
    success = init_db()
    if success:
        print("Database initialized successfully")
    else:
        print("Failed to initialize database")
        sys.exit(1)
