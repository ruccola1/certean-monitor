#!/bin/bash
# Script to fetch environment variables from AWS Systems Manager Parameter Store
# This is a fallback if Amplify Console environment variables don't work

set -e

echo "Fetching environment variables from AWS Parameter Store..."

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
  echo "AWS CLI not found. Skipping Parameter Store fetch."
  exit 0
fi

# Fetch parameters (adjust parameter names to match your setup)
# Format: /certean-monitor/{env-name}
PARAMETER_PREFIX="/certean-monitor"

# List of environment variables to fetch
ENV_VARS=(
  "VITE_AUTH0_DOMAIN"
  "VITE_AUTH0_CLIENT_ID"
  "VITE_AUTH0_REDIRECT_URI"
  "VITE_AUTH0_AUDIENCE"
  "VITE_API_BASE_URL"
  "VITE_CERTEAN_API_KEY"
  "VITE_STRIPE_PUBLISHABLE_KEY"
  "VITE_STRIPE_PRICE_MANAGER"
  "VITE_STRIPE_PRICE_EXPERT"
)

# Fetch each parameter and export as environment variable
for VAR in "${ENV_VARS[@]}"; do
  PARAM_NAME="${PARAMETER_PREFIX}/${VAR}"
  
  # Only fetch if not already set (Amplify Console takes precedence)
  if [ -z "${!VAR}" ]; then
    echo "Fetching ${PARAM_NAME}..."
    
    # Try to get parameter (with error handling)
    VALUE=$(aws ssm get-parameter \
      --name "${PARAM_NAME}" \
      --with-decryption \
      --query 'Parameter.Value' \
      --output text 2>/dev/null || echo "")
    
    if [ -n "${VALUE}" ] && [ "${VALUE}" != "None" ]; then
      export "${VAR}=${VALUE}"
      echo "✓ Set ${VAR} from Parameter Store"
    else
      echo "⚠ Parameter ${PARAM_NAME} not found or empty"
    fi
  else
    echo "✓ ${VAR} already set (from Amplify Console)"
  fi
done

echo "Environment variable fetch complete."

