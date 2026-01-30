#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# Install Playwright and its dependencies
playwright install chromium
playwright install-deps chromium
