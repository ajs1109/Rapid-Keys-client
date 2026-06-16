#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Target resource configuration
RESOURCE_GROUP="sql-azure1"
LOCATION="centralindia"
ACR_NAME="niveshakregistry"
PLAN_NAME="niveshak-plan"
APP_NAME="rapid-keys-app"

echo "=== Azure Resource Setup Script for Rapid-Keys ==="

# Prompt for secrets securely
read -s -p "Enter Database Password: " DB_PASSWORD
echo ""
read -s -p "Enter JWT_SECRET: " JWT_SECRET
echo ""
read -s -p "Enter TOKEN_SECRET: " TOKEN_SECRET
echo ""
read -s -p "Enter REFRESH_SECRET: " REFRESH_SECRET
echo ""

# 1. Ensure Resource Group exists
echo "Checking/creating Resource Group: $RESOURCE_GROUP in $LOCATION..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

# Register required resource providers
echo "Ensuring required Azure resource providers are registered..."
az provider register --namespace Microsoft.ContainerRegistry --wait
az provider register --namespace Microsoft.Web --wait

# 2. Create Azure Container Registry (Basic SKU, Admin Enabled)
echo "Checking/creating Azure Container Registry: $ACR_NAME..."
if ! az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" \
    --sku Basic \
    --admin-enabled true
else
  echo "ACR $ACR_NAME already exists. Skipping creation."
fi

# Retrieve ACR credentials
echo "Retrieving ACR credentials..."
ACR_USER=$(az acr credential show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query username -o tsv)
ACR_PASS=$(az acr credential show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query "passwords[0].value" -o tsv)

# 3. Create App Service Plan (B1 Linux plan)
echo "Checking/creating App Service Plan: $PLAN_NAME..."
if ! az appservice plan show --name "$PLAN_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  az appservice plan create \
    --name "$PLAN_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --sku B1 \
    --is-linux
else
  echo "App Service Plan $PLAN_NAME already exists. Skipping creation."
fi

# 4. Create Web App (configured for container deployment)
echo "Checking/creating Web App: $APP_NAME..."
if ! az webapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  az webapp create \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --plan "$PLAN_NAME" \
    --deployment-container-image-name "$ACR_NAME.azurecr.io/rapid-keys:latest"
else
  echo "Web App $APP_NAME already exists. Skipping creation."
fi

# Enable SCM and FTP Basic Publishing Credentials (required for publish profiles to work)
echo "Enabling SCM and FTP Basic Publishing Credentials on the Web App..."
az resource update --resource-group "$RESOURCE_GROUP" --name scm --namespace Microsoft.Web --resource-type basicPublishingCredentialsPolicies --parent "sites/$APP_NAME" --set properties.allow=true
az resource update --resource-group "$RESOURCE_GROUP" --name ftp --namespace Microsoft.Web --resource-type basicPublishingCredentialsPolicies --parent "sites/$APP_NAME" --set properties.allow=true


# 5. Configure container registry credentials on the Web App
echo "Configuring container settings and registry access on Web App..."
az webapp config container set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --docker-custom-image-name "$ACR_NAME.azurecr.io/rapid-keys:latest" \
  --docker-registry-server-url "https://$ACR_NAME.azurecr.io" \
  --docker-registry-server-user "$ACR_USER" \
  --docker-registry-server-password "$ACR_PASS"

# 6. Apply Environment Variables as App Settings
echo "Configuring application environment settings..."
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@niveshak-azure1.postgres.database.azure.com:5432/postgres?sslmode=require"
SERVER_URI="https://$APP_NAME.azurewebsites.net"

az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    DATABASE_URL="$DATABASE_URL" \
    JWT_SECRET="$JWT_SECRET" \
    TOKEN_SECRET="$TOKEN_SECRET" \
    REFRESH_SECRET="$REFRESH_SECRET" \
    NODE_ENV="production" \
    PORT="8080" \
    WEBSITES_PORT="8080" \
    SERVER_URI="$SERVER_URI"

echo "=== Setup completed successfully! ==="
echo "Your app is configured and will start once the image is pushed to the registry."
echo "App URL: $SERVER_URI"
