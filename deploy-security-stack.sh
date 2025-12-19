#!/bin/bash

###############################################################################
# Secure Marketplace - Complete Security Stack Deployment Script
# Deploys all 10 security requirements in the correct order
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for deployment
wait_for_deployment() {
    local namespace=$1
    local deployment=$2
    print_info "Waiting for $deployment to be ready..."
    kubectl rollout status deployment/$deployment -n $namespace --timeout=300s
}

# Function to wait for daemonset
wait_for_daemonset() {
    local namespace=$1
    local daemonset=$2
    print_info "Waiting for $daemonset to be ready..."
    kubectl rollout status daemonset/$daemonset -n $namespace --timeout=300s
}

###############################################################################
# Pre-flight Checks
###############################################################################

print_info "Starting pre-flight checks..."

# Check required tools
if ! command_exists kubectl; then
    print_error "kubectl is not installed"
    exit 1
fi

if ! command_exists helm; then
    print_warning "helm is not installed (optional for Vault deployment)"
fi

# Check cluster connectivity
if ! kubectl cluster-info >/dev/null 2>&1; then
    print_error "Cannot connect to Kubernetes cluster"
    exit 1
fi

print_success "Pre-flight checks passed"

###############################################################################
# Step 1: Create Namespaces
###############################################################################

print_info "Creating namespaces..."
kubectl create namespace marketplace --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
print_success "Namespaces created"

###############################################################################
# Step 2: Deploy Network Policies
###############################################################################

print_info "Deploying network policies..."
kubectl apply -f k8s/network-policy.yaml
print_success "Network policies deployed"

###############################################################################
# Step 3: Deploy Policy Engine (Choose Kyverno)
###############################################################################

print_info "Deploying Kyverno policy engine..."

# Check if Kyverno is already installed
if ! kubectl get ns kyverno >/dev/null 2>&1; then
    print_info "Installing Kyverno..."
    kubectl create -f https://github.com/kyverno/kyverno/releases/download/v1.11.0/install.yaml
    
    # Wait for Kyverno to be ready
    sleep 10
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=kyverno -n kyverno --timeout=300s
else
    print_info "Kyverno already installed"
fi

# Apply custom policies
print_info "Applying custom Kyverno policies..."
kubectl apply -f k8s/kyverno-policies.yaml
print_success "Kyverno policies deployed"

###############################################################################
# Step 4: Deploy Secrets
###############################################################################

print_info "Deploying secrets..."
kubectl apply -f k8s/secrets.yaml
print_success "Secrets deployed"

###############################################################################
# Step 5: Deploy Monitoring Stack
###############################################################################

print_info "Deploying monitoring stack..."

# Prometheus
print_info "Deploying Prometheus..."
kubectl apply -f k8s/monitoring/prometheus.yaml
wait_for_deployment monitoring prometheus

# Grafana
print_info "Deploying Grafana..."
kubectl apply -f k8s/monitoring/grafana.yaml
wait_for_deployment monitoring grafana

# Loki
print_info "Deploying Loki..."
kubectl apply -f k8s/monitoring/loki.yaml
sleep 5
kubectl wait --for=condition=ready pod -l app=loki -n monitoring --timeout=300s

# Alertmanager
print_info "Deploying Alertmanager..."
kubectl apply -f k8s/monitoring/alertmanager.yaml
wait_for_deployment monitoring alertmanager

print_success "Monitoring stack deployed"

###############################################################################
# Step 6: Deploy Runtime Security (Falco)
###############################################################################

print_info "Deploying Falco runtime security..."
kubectl apply -f k8s/monitoring/falco.yaml
sleep 10
wait_for_daemonset monitoring falco
print_success "Falco deployed"

###############################################################################
# Step 7: Deploy Database
###############################################################################

print_info "Deploying PostgreSQL database..."
kubectl apply -f k8s/postgres.yaml
sleep 10
kubectl wait --for=condition=ready pod -l app=postgres -n marketplace --timeout=300s
print_success "Database deployed"

###############################################################################
# Step 8: Deploy Application Services
###############################################################################

print_info "Deploying application services..."

# Auth Service
print_info "Deploying Auth Service..."
kubectl apply -f k8s/auth-service.yaml
wait_for_deployment marketplace auth-service

# Product Service
print_info "Deploying Product Service..."
kubectl apply -f k8s/product-service.yaml
wait_for_deployment marketplace product-service

print_success "Application services deployed"

###############################################################################
# Step 9: Deploy Ingress (optional)
###############################################################################

if [ -f "k8s/ingress.yaml" ]; then
    print_info "Deploying Ingress..."
    kubectl apply -f k8s/ingress.yaml
    print_success "Ingress deployed"
fi

###############################################################################
# Verification
###############################################################################

print_info "Running verification checks..."

# Check all pods
print_info "Checking pod status..."
echo ""
kubectl get pods -n marketplace
echo ""
kubectl get pods -n monitoring
echo ""

# Check policies
print_info "Checking security policies..."
kubectl get clusterpolicies

# Check services
print_info "Checking services..."
kubectl get svc -n marketplace
kubectl get svc -n monitoring

print_success "Deployment verification complete"

###############################################################################
# Display Access Information
###############################################################################

echo ""
echo "═══════════════════════════════════════════════════════════════"
print_success "DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📊 Monitoring Dashboards:"
echo "   Grafana:       kubectl port-forward -n monitoring svc/grafana 3000:3000"
echo "                  http://localhost:3000 (admin / change-this-password-in-production)"
echo ""
echo "   Prometheus:    kubectl port-forward -n monitoring svc/prometheus 9090:9090"
echo "                  http://localhost:9090"
echo ""
echo "   Alertmanager:  kubectl port-forward -n monitoring svc/alertmanager 9093:9093"
echo "                  http://localhost:9093"
echo ""
echo "🔐 Application Services:"
echo "   Auth Service:  kubectl port-forward -n marketplace svc/auth-service 3001:3001"
echo "                  http://localhost:3001/health"
echo ""
echo "   Product Service: kubectl port-forward -n marketplace svc/product-service 3002:3002"
echo "                  http://localhost:3002/health"
echo ""
echo "📝 Useful Commands:"
echo "   View logs:     kubectl logs -n marketplace deployment/auth-service"
echo "   Check alerts:  kubectl logs -n monitoring deployment/alertmanager"
echo "   Falco events:  kubectl logs -n monitoring daemonset/falco | grep Priority"
echo "   Policy reports: kubectl get policyreport -A"
echo ""
echo "📚 Documentation:"
echo "   Quick Start:   DEPLOYMENT.md"
echo "   Full Guide:    SECURITY_IMPLEMENTATION.md"
echo "   Checklist:     DEPLOYMENT_CHECKLIST.md"
echo "   Overview:      IMPLEMENTATION_OVERVIEW.md"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Optional: Deploy Vault
read -p "Do you want to deploy HashiCorp Vault for secrets management? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command_exists helm; then
        print_info "Deploying Vault..."
        helm repo add hashicorp https://helm.releases.hashicorp.com
        helm repo update
        helm install vault hashicorp/vault --set "server.dev.enabled=true" -n monitoring
        
        print_info "Waiting for Vault to be ready..."
        sleep 10
        kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=vault -n monitoring --timeout=300s
        
        print_success "Vault deployed"
        echo ""
        echo "To initialize Vault:"
        echo "  kubectl exec -it vault-0 -n monitoring -- vault operator init"
        echo "  kubectl exec -it vault-0 -n monitoring -- vault operator unseal <key-1>"
        echo "  kubectl exec -it vault-0 -n monitoring -- vault operator unseal <key-2>"
        echo "  kubectl exec -it vault-0 -n monitoring -- vault operator unseal <key-3>"
    else
        print_error "Helm not found. Install Helm to deploy Vault."
    fi
fi

echo ""
print_success "All security features deployed successfully! 🎉"
echo ""
