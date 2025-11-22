#!/bin/bash
# Script to create/update secrets in AWS Secrets Manager
# Usage: ./scripts/setup-secrets-manager.sh

set -e

SECRET_NAME="${1:-certean-monitor/env-vars}"
REGION="${AWS_REGION:-eu-west-1}"

echo "Setting up AWS Secrets Manager secret: ${SECRET_NAME}"
echo "Region: ${REGION}"
echo ""

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
  echo "❌ AWS CLI not found. Please install it first."
  exit 1
fi

# Check if secret already exists
if aws secretsmanager describe-secret --secret-id "${SECRET_NAME}" --region "${REGION}" &>/dev/null; then
  echo "⚠ Secret ${SECRET_NAME} already exists."
  read -p "Do you want to update it? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
  fi
  UPDATE_MODE="update"
else
  UPDATE_MODE="create"
fi

# Collect environment variables
echo "Enter environment variable values (press Enter to skip):"
echo ""

declare -A SECRET_VALUES

read -p "VITE_AUTH0_DOMAIN: " VITE_AUTH0_DOMAIN
[ -n "${VITE_AUTH0_DOMAIN}" ] && SECRET_VALUES["VITE_AUTH0_DOMAIN"]="${VITE_AUTH0_DOMAIN}"

read -p "VITE_AUTH0_CLIENT_ID: " VITE_AUTH0_CLIENT_ID
[ -n "${VITE_AUTH0_CLIENT_ID}" ] && SECRET_VALUES["VITE_AUTH0_CLIENT_ID"]="${VITE_AUTH0_CLIENT_ID}"

read -p "VITE_AUTH0_REDIRECT_URI (default: https://main.d2uoumf6pfk145.amplifyapp.com): " VITE_AUTH0_REDIRECT_URI
VITE_AUTH0_REDIRECT_URI="${VITE_AUTH0_REDIRECT_URI:-https://main.d2uoumf6pfk145.amplifyapp.com}"
SECRET_VALUES["VITE_AUTH0_REDIRECT_URI"]="${VITE_AUTH0_REDIRECT_URI}"

read -p "VITE_AUTH0_AUDIENCE: " VITE_AUTH0_AUDIENCE
[ -n "${VITE_AUTH0_AUDIENCE}" ] && SECRET_VALUES["VITE_AUTH0_AUDIENCE"]="${VITE_AUTH0_AUDIENCE}"

read -p "VITE_API_BASE_URL (default: https://q57c4vz2em.eu-west-1.awsapprunner.com): " VITE_API_BASE_URL
VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://q57c4vz2em.eu-west-1.awsapprunner.com}"
SECRET_VALUES["VITE_API_BASE_URL"]="${VITE_API_BASE_URL}"

read -sp "VITE_CERTEAN_API_KEY: " VITE_CERTEAN_API_KEY
echo ""
[ -n "${VITE_CERTEAN_API_KEY}" ] && SECRET_VALUES["VITE_CERTEAN_API_KEY"]="${VITE_CERTEAN_API_KEY}"

read -p "VITE_STRIPE_PUBLISHABLE_KEY: " VITE_STRIPE_PUBLISHABLE_KEY
[ -n "${VITE_STRIPE_PUBLISHABLE_KEY}" ] && SECRET_VALUES["VITE_STRIPE_PUBLISHABLE_KEY"]="${VITE_STRIPE_PUBLISHABLE_KEY}"

read -p "VITE_STRIPE_PRICE_MANAGER: " VITE_STRIPE_PRICE_MANAGER
[ -n "${VITE_STRIPE_PRICE_MANAGER}" ] && SECRET_VALUES["VITE_STRIPE_PRICE_MANAGER"]="${VITE_STRIPE_PRICE_MANAGER}"

read -p "VITE_STRIPE_PRICE_EXPERT: " VITE_STRIPE_PRICE_EXPERT
[ -n "${VITE_STRIPE_PRICE_EXPERT}" ] && SECRET_VALUES["VITE_STRIPE_PRICE_EXPERT"]="${VITE_STRIPE_PRICE_EXPERT}"

# Build JSON object
JSON_STRING="{"
FIRST=true
for key in "${!SECRET_VALUES[@]}"; do
  if [ "$FIRST" = false ]; then
    JSON_STRING+=","
  fi
  JSON_STRING+="\"${key}\":\"${SECRET_VALUES[$key]}\""
  FIRST=false
done
JSON_STRING+="}"

# Create or update secret
if [ "${UPDATE_MODE}" = "create" ]; then
  echo ""
  echo "Creating secret..."
  aws secretsmanager create-secret \
    --name "${SECRET_NAME}" \
    --description "Environment variables for Certean Monitor frontend" \
    --secret-string "${JSON_STRING}" \
    --region "${REGION}"
  echo "✅ Secret created successfully!"
else
  echo ""
  echo "Updating secret..."
  aws secretsmanager update-secret \
    --secret-id "${SECRET_NAME}" \
    --secret-string "${JSON_STRING}" \
    --region "${REGION}"
  echo "✅ Secret updated successfully!"
fi

echo ""
echo "Next steps:"
echo "1. Grant Amplify service role permission to read this secret:"
echo "   aws secretsmanager put-resource-policy \\"
echo "     --secret-id ${SECRET_NAME} \\"
echo "     --resource-policy '{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"amplify.amazonaws.com\"},\"Action\":\"secretsmanager:GetSecretValue\",\"Resource\":\"*\"}]}'"
echo ""
echo "2. Add SECRET_NAME environment variable in Amplify Console:"
echo "   SECRET_NAME=${SECRET_NAME}"
echo ""
echo "3. Redeploy your Amplify app"

