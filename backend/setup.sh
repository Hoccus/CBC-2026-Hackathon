#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required but not installed." >&2
  exit 1
fi

if [ ! -d ".venv" ]; then
  echo "Creating virtual environment at backend/.venv..."
  python3 -m venv .venv
fi

echo "Installing dependencies..."
./.venv/bin/pip install --upgrade pip >/dev/null
./.venv/bin/pip install -r requirements.txt

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "Created backend/.env from template."
  echo "Edit it and set ANTHROPIC_API_KEY before running the server."
fi

echo ""
echo "Setup complete. To start the server:"
echo "  ./backend/run.sh"
echo "Or manually:"
echo "  source backend/.venv/bin/activate && uvicorn main:app --reload"
