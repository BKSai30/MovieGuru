#!/bin/bash
set -e

# setup_movieguru_server.sh
# Deployment script for MovieGuru on GCP
# Configured to replace/use same slots as 'deals' (Port 80, Service 'web')

# Configuration
APP_NAME="movieguru"
SERVICE_NAME="web"       # User requested 'web' service name
BACKEND_PORT=5000        # Standard Flask port
NGINX_PORT=80            # Standard HTTP port
USER_NAME=$(whoami)

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Starting MovieGuru Deployment (Service: $SERVICE_NAME)...${NC}"

# 1. Update System
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv nginx git curl acl

# 2. Install Node.js
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 3. Backend Setup
echo -e "${GREEN}Setting up Backend...${NC}"
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# 4. Frontend Setup
echo -e "${GREEN}Setting up Frontend...${NC}"
cd frontend
npm install
npm run build
cd ..

# 5. Systemd Service (web)
echo -e "${GREEN}Configuring Service: $SERVICE_NAME...${NC}"
BACKEND_DIR=$(pwd)/backend

# Note: This overwrites existing 'web' service
sudo bash -c "cat > /etc/systemd/system/${SERVICE_NAME}.service <<EOF
[Unit]
Description=Gunicorn instance to serve MovieGuru
After=network.target

[Service]
User=$USER_NAME
Group=www-data
WorkingDirectory=$BACKEND_DIR
Environment=\"PATH=$BACKEND_DIR/venv/bin\"
ExecStart=$BACKEND_DIR/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:${BACKEND_PORT} app:app

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}
sudo systemctl restart ${SERVICE_NAME}

# 6. Nginx Configuration
echo -e "${GREEN}Configuring Nginx on port ${NGINX_PORT}...${NC}"
FRONTEND_BUILD_DIR=$(pwd)/frontend/dist

# Using tee to avoid nested shell quoting issues
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
server {
    listen ${NGINX_PORT} default_server;
    server_name _;

    location / {
        root $FRONTEND_BUILD_DIR;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Ensure it's enabled
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}Service 'web' is running on Port ${BACKEND_PORT}.${NC}"
echo -e "${GREEN}Nginx is proxying Port ${NGINX_PORT} -> ${BACKEND_PORT}.${NC}"
echo -e "${GREEN}Monitor logs with: sudo journalctl -u web -f${NC}"
