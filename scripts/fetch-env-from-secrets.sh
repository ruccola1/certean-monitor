#!/bin/bash
# Script to fetch environment variables from AWS Secrets Manager
# This is a fallback if Amplify Console environment variables don't work

set -e

echo "Fetching environment variables from AWS Secrets Manager..."

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
  echo "AWS CLI not found. Skipping Secrets Manager fetch."
  exit 0
fi

# Secret name in Secrets Manager (adjust to match your setup)
SECRET_NAME="${SECRET_NAME:-certean-monitor/env-vars}"

# Only fetch if not already set (Amplify Console takes precedence)
if [ -z "${VITE_AUTH0_DOMAIN}" ] || [ -z "${VITE_AUTH0_CLIENT_ID}" ]; then
  echo "Fetching secrets from ${SECRET_NAME}..."
  
  # Fetch secret as JSON
  SECRET_JSON=$(aws secretsmanager get-secret-value \
    --secret-id "${SECRET_NAME}" \
    --query 'SecretString' \
    --output text 2>/dev/null || echo "{}")
  
  if [ "${SECRET_JSON}" != "{}" ] && [ -n "${SECRET_JSON}" ]; then
    # Parse JSON and export each variable
    # Using jq if available, otherwise using Python
    if command -v jq &> /dev/null; then
      echo "Using jq to parse secrets..."
      while IFS='=' read -r key value; do
        if [ -n "${key}" ] && [ -n "${value}" ]; then
          # Only set if not already set
          if [ -z "${!key}" ]; then
            export "${key}=${value}"
            echo "✓ Set ${key} from Secrets Manager"
          fi
        fi
      done < <(echo "${SECRET_JSON}" | jq -r 'to_entries[] | "\(.key)=\(.value)"')
    elif command -v python3 &> /dev/null; then
      echo "Using Python to parse secrets..."
      python3 << EOF
import json
import os
import sys

try:
    secret_json = '''${SECRET_JSON}'''
    secrets = json.loads(secret_json)
    
    for key, value in secrets.items():
        if not os.environ.get(key):
            os.environ[key] = str(value)
            print(f"✓ Set {key} from Secrets Manager")
        else:
            print(f"⚠ {key} already set (from Amplify Console)")
except Exception as e:
    print(f"Error parsing secrets: {e}", file=sys.stderr)
    sys.exit(1)
EOF
      # Export variables set by Python script
      eval $(python3 << PYEOF
import json
import os

secret_json = '''${SECRET_JSON}'''
secrets = json.loads(secret_json)

for key, value in secrets.items():
    if not os.environ.get(key):
        print(f'export {key}="{value}"')
PYEOF
)
    else
      echo "⚠ Neither jq nor python3 found. Cannot parse JSON secrets."
      echo "Install jq: brew install jq (macOS) or apt-get install jq (Linux)"
      exit 1
    fi
  else
    echo "⚠ Secret ${SECRET_NAME} not found or empty"
  fi
else
  echo "✓ Environment variables already set (from Amplify Console)"
fi

echo "Environment variable fetch complete."

