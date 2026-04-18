#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
  echo "No virtual environment found. Run ./backend/setup.sh first." >&2
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "No .env file found. Run ./backend/setup.sh and set ANTHROPIC_API_KEY." >&2
  exit 1
fi

exec ./.venv/bin/uvicorn main:app --reload
