#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# Install Playwright chromium browser only (skip system deps for Render free tier)
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0 playwright install chromium --with-deps || playwright install chromium
