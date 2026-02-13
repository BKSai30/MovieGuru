#!/bin/bash

# create_deploy_package.sh
# Zips the current project for deployment, excluding heavy/unnecessary folders.

PROJECT_NAME="MovieGuru"
ZIP_NAME="${PROJECT_NAME}_deploy.zip"

echo "Creating deployment package: $ZIP_NAME..."

# Remove old zip if exists
rm -f "$ZIP_NAME"

# Create zip, excluding:
# - node_modules (install on server)
# - venv (install on server)
# - .git (not needed for run)
# - dist (build on server)
# - __pycache__ (generated)
# - .DS_Store (macOS junk)

zip -r "$ZIP_NAME" . \
    -x "frontend/node_modules/*" \
    -x "backend/venv/*" \
    -x ".git/*" \
    -x "frontend/dist/*" \
    -x "*/__pycache__/*" \
    -x "**/.DS_Store" \
    -x "$ZIP_NAME"

echo "-----------------------------------"
echo "Package created: $ZIP_NAME"
echo "Size: $(du -h $ZIP_NAME | cut -f1)"
echo "-----------------------------------"
echo "To upload to GCP via command line:"
echo "gcloud compute scp $ZIP_NAME YOUR_INSTANCE_NAME:~/"
echo ""
echo "Or upload via GCP Console > SSH > Upload File"
