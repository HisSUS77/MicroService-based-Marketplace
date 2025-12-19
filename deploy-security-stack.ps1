# Security Stack Deployment Script
# PowerShell version for Windows

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if command exists
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Wait for deployment
function Wait-ForDeployment {
    param($Namespace, $Deployment)
    Write-Info "Waiting for $Deployment to be ready..."
    kubectl rollout status deployment/$Deployment -n $Namespace --timeout=300s
}

# Wait for daemonset
function Wait-ForDaemonSet {
    param($Namespace, $DaemonSet)
    Write-Info "Waiting for $DaemonSet to be ready..."
    kubectl rollout status daemonset/$DaemonSet -n $Namespace --timeout=300s
}

###############################################################################
# Pre-flight Checks
###############################################################################

Write-Info "Starting pre-flight checks..."

if (!(Test-Command kubectl)) {
    Write-Error "kubectl is not installed"
    exit 1
}

if (!(Test-Command helm)) {
    Write-Warning "helm is not installed (optional for Vault deployment)"
}

# Check cluster connectivity
try {
    kubectl cluster-info 2>&1 | Out-Null
} catch {
    Write-Error "Cannot connect to Kubernetes cluster"
    exit 1
}

Write-Success "Pre-flight checks passed"

###############################################################################
# Step 1: Create Namespaces
###############################################################################

Write-Info "Creating namespaces..."
kubectl create namespace marketplace --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
Write-Success "Namespaces created"

###############################################################################
# Step 2: Deploy Network Policies
###############################################################################

Write-Info "Deploying network policies..."
kubectl apply -f k8s/network-policy.yaml
Write-Success "Network policies deployed"

###############################################################################
# Step 3: Deploy Policy Engine (Kyverno)
###############################################################################

Write-Info "Deploying Kyverno policy engine..."

try {
    kubectl get ns kyverno 2>&1 | Out-Null
    Write-Info "Kyverno already installed"
} catch {
    Write-Info "Installing Kyverno..."
    kubectl create -f https://github.com/kyverno/kyverno/releases/download/v1.11.0/install.yaml
    
    Start-Sleep -Seconds 10
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=kyverno -n kyverno --timeout=300s
}

Write-Info "Applying custom Kyverno policies..."
kubectl apply -f k8s/kyverno-policies.yaml
Write-Success "Kyverno policies deployed"

###############################################################################
# Step 4: Deploy Secrets
###############################################################################

Write-Info "Deploying secrets..."
kubectl apply -f k8s/secrets.yaml
Write-Success "Secrets deployed"

###############################################################################
# Step 5: Deploy Monitoring Stack
###############################################################################

Write-Info "Deploying monitoring stack..."

# Prometheus
Write-Info "Deploying Prometheus..."
kubectl apply -f k8s/monitoring/prometheus.yaml
Wait-ForDeployment -Namespace monitoring -Deployment prometheus

# Grafana
Write-Info "Deploying Grafana..."
kubectl apply -f k8s/monitoring/grafana.yaml
Wait-ForDeployment -Namespace monitoring -Deployment grafana

# Loki
Write-Info "Deploying Loki..."
kubectl apply -f k8s/monitoring/loki.yaml
Start-Sleep -Seconds 5
kubectl wait --for=condition=ready pod -l app=loki -n monitoring --timeout=300s

# Alertmanager
Write-Info "Deploying Alertmanager..."
kubectl apply -f k8s/monitoring/alertmanager.yaml
Wait-ForDeployment -Namespace monitoring -Deployment alertmanager

Write-Success "Monitoring stack deployed"

###############################################################################
# Step 6: Deploy Runtime Security (Falco)
###############################################################################

Write-Info "Deploying Falco runtime security..."
kubectl apply -f k8s/monitoring/falco.yaml
Start-Sleep -Seconds 10
Wait-ForDaemonSet -Namespace monitoring -DaemonSet falco
Write-Success "Falco deployed"

###############################################################################
# Step 7: Deploy Database
###############################################################################

Write-Info "Deploying PostgreSQL database..."
kubectl apply -f k8s/postgres.yaml
Start-Sleep -Seconds 10
kubectl wait --for=condition=ready pod -l app=postgres -n marketplace --timeout=300s
Write-Success "Database deployed"

###############################################################################
# Step 8: Deploy Application Services
###############################################################################

Write-Info "Deploying application services..."

# Auth Service
Write-Info "Deploying Auth Service..."
kubectl apply -f k8s/auth-service.yaml
Wait-ForDeployment -Namespace marketplace -Deployment auth-service

# Product Service
Write-Info "Deploying Product Service..."
kubectl apply -f k8s/product-service.yaml
Wait-ForDeployment -Namespace marketplace -Deployment product-service

Write-Success "Application services deployed"

###############################################################################
# Step 9: Deploy Ingress (optional)
###############################################################################

if (Test-Path "k8s/ingress.yaml") {
    Write-Info "Deploying Ingress..."
    kubectl apply -f k8s/ingress.yaml
    Write-Success "Ingress deployed"
}

###############################################################################
# Verification
###############################################################################

Write-Info "Running verification checks..."

Write-Info "Checking pod status..."
Write-Host ""
kubectl get pods -n marketplace
Write-Host ""
kubectl get pods -n monitoring
Write-Host ""

Write-Info "Checking security policies..."
kubectl get clusterpolicies

Write-Info "Checking services..."
kubectl get svc -n marketplace
kubectl get svc -n monitoring

Write-Success "Deployment verification complete"

###############################################################################
# Display Access Information
###############################################################################

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Success "DEPLOYMENT COMPLETE!"
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Monitoring Dashboards:" -ForegroundColor Yellow
Write-Host "   Grafana:       kubectl port-forward -n monitoring svc/grafana 3000:3000"
Write-Host "                  http://localhost:3000 (admin / change-this-password-in-production)"
Write-Host ""
Write-Host "   Prometheus:    kubectl port-forward -n monitoring svc/prometheus 9090:9090"
Write-Host "                  http://localhost:9090"
Write-Host ""
Write-Host "   Alertmanager:  kubectl port-forward -n monitoring svc/alertmanager 9093:9093"
Write-Host "                  http://localhost:9093"
Write-Host ""
Write-Host "🔐 Application Services:" -ForegroundColor Yellow
Write-Host "   Auth Service:  kubectl port-forward -n marketplace svc/auth-service 3001:3001"
Write-Host "                  http://localhost:3001/health"
Write-Host ""
Write-Host "   Product Service: kubectl port-forward -n marketplace svc/product-service 3002:3002"
Write-Host "                  http://localhost:3002/health"
Write-Host ""
Write-Host "📝 Useful Commands:" -ForegroundColor Yellow
Write-Host "   View logs:     kubectl logs -n marketplace deployment/auth-service"
Write-Host "   Check alerts:  kubectl logs -n monitoring deployment/alertmanager"
Write-Host "   Falco events:  kubectl logs -n monitoring daemonset/falco | Select-String Priority"
Write-Host "   Policy reports: kubectl get policyreport -A"
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   Quick Start:   DEPLOYMENT.md"
Write-Host "   Full Guide:    SECURITY_IMPLEMENTATION.md"
Write-Host "   Checklist:     DEPLOYMENT_CHECKLIST.md"
Write-Host "   Overview:      IMPLEMENTATION_OVERVIEW.md"
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Optional: Deploy Vault
$deployVault = Read-Host "Do you want to deploy HashiCorp Vault for secrets management? (y/n)"
if ($deployVault -eq 'y' -or $deployVault -eq 'Y') {
    if (Test-Command helm) {
        Write-Info "Deploying Vault..."
        helm repo add hashicorp https://helm.releases.hashicorp.com
        helm repo update
        helm install vault hashicorp/vault --set "server.dev.enabled=true" -n monitoring
        
        Write-Info "Waiting for Vault to be ready..."
        Start-Sleep -Seconds 10
        kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=vault -n monitoring --timeout=300s
        
        Write-Success "Vault deployed"
        Write-Host ""
        Write-Host "To initialize Vault:"
        Write-Host "  kubectl exec -it vault-0 -n monitoring -- vault operator init"
        Write-Host "  kubectl exec -it vault-0 -n monitoring -- vault operator unseal <key-1>"
        Write-Host "  kubectl exec -it vault-0 -n monitoring -- vault operator unseal <key-2>"
        Write-Host "  kubectl exec -it vault-0 -n monitoring -- vault operator unseal <key-3>"
    } else {
        Write-Error "Helm not found. Install Helm to deploy Vault."
    }
}

Write-Host ""
Write-Success "All security features deployed successfully! 🎉"
Write-Host ""
