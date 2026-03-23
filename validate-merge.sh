set -e

echo "=== Pre-merge validation ==="
echo "1. Checking for common merge issues..."

# Check for merge conflicts markers
if find . -type f -name "*.js" -o -name "*.jsx" -o -name "*.json" | xargs grep -l "^<<<<<<< HEAD" 2>/dev/null; then
    echo "ERROR: Merge conflict markers found!"
    exit 1
fi

# Check for required files
required_files=("package.json" "src/testSetup.js" "babel.config.js" "jest.config.js")
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "ERROR: Missing required file: $file"
        exit 1
    fi
done

echo "2. Running full test suite..."
npm test --silent > /dev/null 2>&1 || {
    echo "Tests failed - ready for debugging"
    npm test -- --bail=false --verbose --no-cache || true
    exit 1
}

echo "3. All checks passed - ready for merge"
exit 0
