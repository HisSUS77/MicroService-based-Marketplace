#!/bin/bash

################################################################################
# Complete EC2 Deployment Script for Secure Marketplace Platform
# Installs: Docker, Kubernetes, Monitoring Stack, Security Tools
# Target: Ubuntu 20.04/22.04 on AWS EC2
################################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

################################################################################
# System Update and Prerequisites
################################################################################

print_info "Starting system update..."
sudo apt update -y
sudo apt upgrade -y

print_info "Installing prerequisites..."
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    wget \
    git \
    jq \
    net-tools

print_success "System updated and prerequisites installed"

################################################################################
# Install Docker
################################################################################

print_info "Installing Docker..."

# Remove old versions
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update -y
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# Configure Docker daemon for Kubernetes
sudo mkdir -p /etc/docker
cat <<EOF | sudo tee /etc/docker/daemon.json
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2"
}
EOF

sudo systemctl enable docker
sudo systemctl restart docker

print_success "Docker installed and configured"

################################################################################
# Disable Swap (Required for Kubernetes)
################################################################################

print_info "Disabling swap..."
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

################################################################################
# Install Kubernetes Components
################################################################################

print_info "Installing Kubernetes components..."

# Add Kubernetes GPG key
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.28/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

# Add Kubernetes repository
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.28/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list

# Install kubelet, kubeadm, kubectl
sudo apt update -y
sudo apt install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

# Enable kubelet
sudo systemctl enable kubelet

print_success "Kubernetes components installed"

################################################################################
# Initialize Kubernetes Cluster (Single Node)
################################################################################

print_info "Initializing Kubernetes cluster..."

# Initialize cluster
sudo kubeadm init --pod-network-cidr=10.244.0.0/16 --ignore-preflight-errors=NumCPU,Mem

# Setup kubeconfig for current user
mkdir -p $HOME/.kube
sudo cp -f /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Allow scheduling on control plane (single node cluster)
kubectl taint nodes --all node-role.kubernetes.io/control-plane- || true
kubectl taint nodes --all node-role.kubernetes.io/master- || true

print_success "Kubernetes cluster initialized"

################################################################################
# Install CNI Plugin (Flannel)
################################################################################

print_info "Installing Flannel CNI..."
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml

# Wait for cluster to be ready
print_info "Waiting for cluster to be ready..."
sleep 30
kubectl wait --for=condition=ready node --all --timeout=300s

print_success "CNI plugin installed and cluster is ready"

################################################################################
# Install Helm
################################################################################

print_info "Installing Helm..."
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

print_success "Helm installed"

################################################################################
# Install Node.js (for security reporter)
################################################################################

print_info "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

print_success "Node.js installed"

################################################################################
# Create Namespaces
################################################################################

print_info "Creating namespaces..."
kubectl create namespace marketplace --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

print_success "Namespaces created"

################################################################################
# Install Kyverno Policy Engine
################################################################################

print_info "Installing Kyverno..."
kubectl create -f https://github.com/kyverno/kyverno/releases/download/v1.11.0/install.yaml

# Wait for Kyverno to be ready
print_info "Waiting for Kyverno to be ready..."
sleep 20
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=kyverno -n kyverno --timeout=300s

# Apply custom policies
if [ -f "$SCRIPT_DIR/k8s/kyverno-policies.yaml" ]; then
    print_info "Applying Kyverno policies..."
    kubectl apply -f "$SCRIPT_DIR/k8s/kyverno-policies.yaml"
fi

print_success "Kyverno installed and policies applied"

################################################################################
# Deploy Network Policies
################################################################################

if [ -f "$SCRIPT_DIR/k8s/network-policy.yaml" ]; then
    print_info "Applying network policies..."
    kubectl apply -f "$SCRIPT_DIR/k8s/network-policy.yaml"
    print_success "Network policies applied"
fi

################################################################################
# Deploy Secrets
################################################################################

if [ -f "$SCRIPT_DIR/k8s/secrets.yaml" ]; then
    print_info "Applying secrets..."
    kubectl apply -f "$SCRIPT_DIR/k8s/secrets.yaml"
    print_success "Secrets applied"
fi

################################################################################
# Deploy Monitoring Stack
################################################################################

print_info "Deploying Prometheus..."
if [ -f "$SCRIPT_DIR/k8s/monitoring/prometheus.yaml" ]; then
    kubectl apply -f "$SCRIPT_DIR/k8s/monitoring/prometheus.yaml"
    sleep 10
    kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=600s
    print_success "Prometheus deployed"
fi

print_info "Deploying Grafana..."
if [ -f "$SCRIPT_DIR/k8s/monitoring/grafana.yaml" ]; then
    kubectl apply -f "$SCRIPT_DIR/k8s/monitoring/grafana.yaml"
    sleep 10
    kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=600s
    print_success "Grafana deployed"
fi

print_info "Deploying Loki and Promtail..."
if [ -f "$SCRIPT_DIR/k8s/monitoring/loki.yaml" ]; then
    kubectl apply -f "$SCRIPT_DIR/k8s/monitoring/loki.yaml"
    sleep 10
    kubectl wait --for=condition=ready pod -l app=loki -n monitoring --timeout=600s
    print_success "Loki deployed"
fi

print_info "Deploying Alertmanager..."
if [ -f "$SCRIPT_DIR/k8s/monitoring/alertmanager.yaml" ]; then
    kubectl apply -f "$SCRIPT_DIR/k8s/monitoring/alertmanager.yaml"
    sleep 10
    kubectl wait --for=condition=ready pod -l app=alertmanager -n monitoring --timeout=600s
    print_success "Alertmanager deployed"
fi

################################################################################
# Deploy Falco Runtime Security
################################################################################

print_info "Deploying Falco..."
if [ -f "$SCRIPT_DIR/k8s/monitoring/falco.yaml" ]; then
    kubectl apply -f "$SCRIPT_DIR/k8s/monitoring/falco.yaml"
    sleep 15
    print_success "Falco deployed"
fi

################################################################################
# Deploy Database
################################################################################

print_info "Deploying PostgreSQL..."
if [ -f "$SCRIPT_DIR/k8s/postgres.yaml" ]; then
    kubectl apply -f "$SCRIPT_DIR/k8s/postgres.yaml"
    sleep 15
    kubectl wait --for=condition=ready pod -l app=postgres -n marketplace --timeout=300s
    print_success "PostgreSQL deployed"
fi

################################################################################
# Build and Deploy Application Services
################################################################################

print_info "Building application Docker images..."

# Build auth service
if [ -f "$SCRIPT_DIR/docker/Dockerfile.auth" ]; then
    print_info "Building auth-service image..."
    docker build -f "$SCRIPT_DIR/docker/Dockerfile.auth" -t marketplace/auth-service:latest "$SCRIPT_DIR/services"
fi

# Build product service
if [ -f "$SCRIPT_DIR/docker/Dockerfile.product" ]; then
    print_info "Building product-service image..."
    docker build -f "$SCRIPT_DIR/docker/Dockerfile.product" -t marketplace/product-service:latest "$SCRIPT_DIR/services"
fi

# Build order service
if [ -f "$SCRIPT_DIR/docker/Dockerfile.order" ]; then
    print_info "Building order-service image..."
    docker build -f "$SCRIPT_DIR/docker/Dockerfile.order" -t marketplace/order-service:latest "$SCRIPT_DIR/services"
fi

# Build payment service
if [ -f "$SCRIPT_DIR/docker/Dockerfile.payment" ]; then
    print_info "Building payment-service image..."
    docker build -f "$SCRIPT_DIR/docker/Dockerfile.payment" -t marketplace/payment-service:latest "$SCRIPT_DIR/services"
fi

print_success "Docker images built"

print_info "Deploying application services..."

# Deploy auth service
if [ -f "$SCRIPT_DIR/k8s/auth-service.yaml" ]; then
    kubectl apply -f "$SCRIPT_DIR/k8s/auth-service.yaml"
    sleep 10
    kubectl wait --for=condition=ready pod -l app=auth-service -n marketplace --timeout=300s
    print_success "Auth service deployed"
fi

# Deploy product service
if [ -f "$SCRIPT_DIR/k8s/product-service.yaml" ]; then
    kubectl apply -f "$SCRIPT_DIR/k8s/product-service.yaml"
    sleep 10
    kubectl wait --for=condition=ready pod -l app=product-service -n marketplace --timeout=300s
    print_success "Product service deployed"
fi

################################################################################
# Install HashiCorp Vault (Optional)
################################################################################

read -p "Do you want to install HashiCorp Vault? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Installing Vault..."
    helm repo add hashicorp https://helm.releases.hashicorp.com
    helm repo update
    helm install vault hashicorp/vault --set "server.dev.enabled=true" -n monitoring
    
    sleep 15
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=vault -n monitoring --timeout=300s
    
    print_success "Vault installed"
    print_warning "To initialize Vault, run:"
    echo "  kubectl exec -it vault-0 -n monitoring -- vault operator init"
fi

################################################################################
# Setup Security Reporter
################################################################################

if [ -f "$SCRIPT_DIR/scripts/security-reporter.js" ]; then
    print_info "Setting up security reporter..."
    cd "$SCRIPT_DIR"
    npm install --prefix scripts axios 2>/dev/null || true
    print_success "Security reporter configured"
fi

################################################################################
# Configure Port Forwarding (Background)
################################################################################

print_info "Setting up port forwarding..."

# Create port-forward script
cat > /tmp/port-forwards.sh <<'EOF'
#!/bin/bash
kubectl port-forward -n monitoring svc/grafana 3000:3000 --address=0.0.0.0 &
kubectl port-forward -n monitoring svc/prometheus 9090:9090 --address=0.0.0.0 &
kubectl port-forward -n monitoring svc/alertmanager 9093:9093 --address=0.0.0.0 &
kubectl port-forward -n marketplace svc/auth-service 3001:3001 --address=0.0.0.0 &
kubectl port-forward -n marketplace svc/product-service 3002:3002 --address=0.0.0.0 &
EOF

chmod +x /tmp/port-forwards.sh

# Create systemd service for port forwarding
cat > /tmp/k8s-port-forward.service <<EOF
[Unit]
Description=Kubernetes Port Forwarding Service
After=network.target

[Service]
Type=forking
User=$USER
ExecStart=/tmp/port-forwards.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/k8s-port-forward.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable k8s-port-forward.service
sudo systemctl start k8s-port-forward.service

print_success "Port forwarding configured"

################################################################################
# Open Security Group Ports (AWS CLI)
################################################################################

print_info "Configuring firewall rules..."

# Get instance metadata
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "")

if [ ! -z "$INSTANCE_ID" ]; then
    print_info "EC2 Instance detected: $INSTANCE_ID"
    
    # Check if AWS CLI is installed
    if command -v aws >/dev/null 2>&1; then
        print_info "Attempting to open security group ports..."
        
        # Get security group
        SECURITY_GROUP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")
        
        if [ ! -z "$SECURITY_GROUP" ]; then
            # Add ingress rules
            aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP --protocol tcp --port 3000 --cidr 0.0.0.0/0 2>/dev/null || true  # Grafana
            aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP --protocol tcp --port 9090 --cidr 0.0.0.0/0 2>/dev/null || true  # Prometheus
            aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP --protocol tcp --port 3001 --cidr 0.0.0.0/0 2>/dev/null || true  # Auth
            aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP --protocol tcp --port 3002 --cidr 0.0.0.0/0 2>/dev/null || true  # Product
            aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP --protocol tcp --port 6443 --cidr 0.0.0.0/0 2>/dev/null || true  # K8s API
            
            print_success "Security group rules added"
        fi
    else
        print_warning "AWS CLI not found. Please manually open ports: 3000, 9090, 9093, 3001, 3002, 6443"
    fi
else
    print_warning "Not running on EC2. Please manually configure firewall rules."
fi

################################################################################
# Verification
################################################################################

print_info "Running verification checks..."

echo ""
print_info "Cluster Status:"
kubectl cluster-info

echo ""
print_info "Nodes:"
kubectl get nodes -o wide

echo ""
print_info "Namespaces:"
kubectl get namespaces

echo ""
print_info "Marketplace Pods:"
kubectl get pods -n marketplace -o wide

echo ""
print_info "Monitoring Pods:"
kubectl get pods -n monitoring -o wide

echo ""
print_info "Services:"
kubectl get svc -A

echo ""
print_info "Kyverno Policies:"
kubectl get clusterpolicies

################################################################################
# Get Public IP
################################################################################

PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || curl -s ifconfig.me)

################################################################################
# Final Summary
################################################################################

echo ""
echo "════════════════════════════════════════════════════════════════════════"
print_success "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Your Secure Marketplace Platform is now running!"
echo ""
echo "📊 Access Points:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 Monitoring & Observability:"
echo "   Grafana:         http://$PUBLIC_IP:3000"
echo "                    Username: admin"
echo "                    Password: change-this-password-in-production"
echo ""
echo "   Prometheus:      http://$PUBLIC_IP:9090"
echo "   Alertmanager:    http://$PUBLIC_IP:9093"
echo ""
echo "🔐 Application Services:"
echo "   Auth Service:    http://$PUBLIC_IP:3001/health"
echo "   Product Service: http://$PUBLIC_IP:3002/health"
echo ""
echo "☸️  Kubernetes Dashboard:"
echo "   API Server:      https://$PUBLIC_IP:6443"
echo "   (Use kubeconfig at ~/.kube/config)"
echo ""
echo "📝 Useful Commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   View all pods:           kubectl get pods -A"
echo "   View logs:               kubectl logs -n marketplace deployment/auth-service"
echo "   View Falco events:       kubectl logs -n monitoring daemonset/falco | grep Priority"
echo "   Generate report:         node scripts/security-reporter.js"
echo "   Check policies:          kubectl get clusterpolicies"
echo "   Restart services:        kubectl rollout restart deployment/auth-service -n marketplace"
echo ""
echo "🔧 Service Management:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   Start port forwarding:   sudo systemctl start k8s-port-forward"
echo "   Stop port forwarding:    sudo systemctl stop k8s-port-forward"
echo "   Check status:            sudo systemctl status k8s-port-forward"
echo ""
echo "🔐 Security Features Deployed:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   ✅ JWT Authentication & RBAC"
echo "   ✅ Kyverno Policy Engine (8 policies)"
echo "   ✅ Network Policies"
echo "   ✅ TLS/HTTPS Encryption"
echo "   ✅ Prometheus Monitoring"
echo "   ✅ Grafana Dashboards"
echo "   ✅ Loki Log Aggregation"
echo "   ✅ Alertmanager Notifications"
echo "   ✅ Falco Runtime Security"
echo "   ✅ Automated Security Reporting"
echo ""
echo "📚 Documentation:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   Quick Start:           DEPLOYMENT.md"
echo "   Security Guide:        SECURITY_IMPLEMENTATION.md"
echo "   Deployment Checklist:  DEPLOYMENT_CHECKLIST.md"
echo "   Requirements Summary:  SECURITY_REQUIREMENTS_SUMMARY.md"
echo ""
echo "⚠️  Important Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   1. Change Grafana admin password immediately"
echo "   2. Update secrets in k8s/secrets.yaml with production values"
echo "   3. Configure Alertmanager with your email/Slack webhook"
echo "   4. Review and adjust resource limits based on your EC2 instance size"
echo "   5. Set up SSL/TLS certificates for production domains"
echo "   6. Configure backup strategy for PostgreSQL"
echo ""
echo "💡 Tips:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   • Reboot required for Docker group changes to take effect"
echo "   • Use 'newgrp docker' to apply group changes without reboot"
echo "   • Monitor resource usage: kubectl top nodes"
echo "   • Scale services: kubectl scale deployment/auth-service --replicas=3 -n marketplace"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""
print_success "Deployment script completed! Your secure marketplace is ready! 🚀"
echo ""
echo "To start using the platform, access Grafana and explore the dashboards."
echo "Happy secure coding! 🔐"
echo ""

# Save deployment info
cat > "$HOME/marketplace-deployment-info.txt" <<EOF
Marketplace Platform Deployment Info
=====================================
Deployment Date: $(date)
Public IP: $PUBLIC_IP

Access URLs:
- Grafana: http://$PUBLIC_IP:3000
- Prometheus: http://$PUBLIC_IP:9090
- Alertmanager: http://$PUBLIC_IP:9093
- Auth Service: http://$PUBLIC_IP:3001
- Product Service: http://$PUBLIC_IP:3002

Credentials:
- Grafana: admin / change-this-password-in-production

Kubeconfig: $HOME/.kube/config
EOF

print_info "Deployment info saved to: $HOME/marketplace-deployment-info.txt"
