# 🚀 Quick Deployment Guide

Deploy the complete secure marketplace platform with all security features.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- Helm 3.x
- Docker
- Node.js 20+
- Terraform (optional, for Azure deployment)

## Quick Start

### 1. Deploy Core Infrastructure

```bash
# Create namespaces
kubectl create namespace marketplace
kubectl create namespace monitoring

# Apply secrets
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/namespace.yaml

# Deploy database
kubectl apply -f k8s/postgres.yaml
```

### 2. Deploy Security Policies

```bash
# Choose one: Kyverno (recommended) or OPA Gatekeeper

# Option A: Kyverno
kubectl create -f https://github.com/kyverno/kyverno/releases/download/v1.11.0/install.yaml
kubectl apply -f k8s/kyverno-policies.yaml

# Option B: OPA Gatekeeper
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/master/deploy/gatekeeper.yaml
kubectl apply -f k8s/opa-gatekeeper-constraints.yaml
```

### 3. Deploy Monitoring Stack

```bash
# Deploy Prometheus
kubectl apply -f k8s/monitoring/prometheus.yaml

# Deploy Grafana
kubectl apply -f k8s/monitoring/grafana.yaml

# Deploy Loki & Promtail
kubectl apply -f k8s/monitoring/loki.yaml

# Deploy Alertmanager
kubectl apply -f k8s/monitoring/alertmanager.yaml

# Deploy Falco (Runtime Security)
kubectl apply -f k8s/monitoring/falco.yaml
```

### 4. Deploy Application Services

```bash
# Apply network policies
kubectl apply -f k8s/network-policy.yaml

# Deploy services
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/product-service.yaml

# Deploy ingress
kubectl apply -f k8s/ingress.yaml
```

### 5. Setup Secrets Management (Optional but Recommended)

```bash
# For Vault
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault

# Initialize Vault (follow prompts)
kubectl exec -it vault-0 -- vault operator init
kubectl exec -it vault-0 -- vault operator unseal <key-1>
kubectl exec -it vault-0 -- vault operator unseal <key-2>
kubectl exec -it vault-0 -- vault operator unseal <key-3>

# Store secrets in Vault
kubectl exec -it vault-0 -- vault kv put secret/marketplace/database/credentials \
  username=postgres password=your-secure-password

# Enable Vault integration in services
kubectl set env deployment/auth-service USE_VAULT=true VAULT_ADDR=http://vault:8200
```

### 6. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n marketplace
kubectl get pods -n monitoring

# Check services
kubectl get svc -n marketplace
kubectl get svc -n monitoring

# View logs
kubectl logs -n marketplace deployment/auth-service
kubectl logs -n monitoring deployment/prometheus
```

### 7. Access Services

```bash
# Port-forward Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000
# Open http://localhost:3000 (admin / change-this-password-in-production)

# Port-forward Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Open http://localhost:9090

# Port-forward Auth Service
kubectl port-forward -n marketplace svc/auth-service 3001:3001
# Test: curl http://localhost:3001/health
```

## CI/CD Setup

### GitHub Actions

1. **Add Secrets to GitHub Repository:**
   - Go to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `KUBE_CONFIG`: Your Kubernetes config (base64 encoded)
     - `SONAR_TOKEN`: SonarQube token
     - `SONAR_HOST_URL`: SonarQube server URL

2. **Push to Main Branch:**
```bash
git add .
git commit -m "Deploy security features"
git push origin main
```

3. **Monitor Pipeline:**
   - Go to Actions tab in GitHub
   - Watch the CI/CD pipeline execute:
     - Security scans (Trivy, Checkov)
     - SAST (SonarQube)
     - Build and push images
     - Deploy to Kubernetes
     - CIS benchmarks

## Security Monitoring

### View Security Metrics

```bash
# Grafana Dashboard
kubectl port-forward -n monitoring svc/grafana 3000:3000
# Navigate to "Security Monitoring" dashboard

# Prometheus Alerts
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Check Alerts page

# Falco Events
kubectl logs -n monitoring daemonset/falco -f | grep Priority
```

### Generate Security Report

```bash
# Run report generator
node scripts/security-reporter.js

# View reports
ls reports/
open reports/security-report-*.html
```

## Testing Security Features

### 1. Test Policy Enforcement

```bash
# Try to deploy privileged container (should be blocked)
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: privileged-test
  namespace: marketplace
spec:
  containers:
  - name: test
    image: nginx
    securityContext:
      privileged: true
EOF
# Expected: Error from admission webhook
```

### 2. Test Authentication

```bash
# Register user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","role":"BUYER"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

### 3. Test Rate Limiting

```bash
# Send multiple rapid requests
for i in {1..150}; do 
  curl http://localhost:3001/health
done
# Expected: 429 Too Many Requests after 100 requests
```

### 4. Test Falco Detection

```bash
# Spawn shell in container (should trigger alert)
kubectl exec -it -n marketplace deployment/auth-service -- /bin/sh
exit

# Check Falco alerts
kubectl logs -n monitoring daemonset/falco | grep "Shell Spawned"
```

## Cleanup

```bash
# Delete all resources
kubectl delete namespace marketplace
kubectl delete namespace monitoring

# If using Terraform
cd iac
terraform destroy
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n marketplace

# Check logs
kubectl logs <pod-name> -n marketplace

# Check events
kubectl get events -n marketplace --sort-by='.lastTimestamp'
```

### Policy Violations

```bash
# Check Kyverno policy reports
kubectl get policyreport -A

# Check OPA Gatekeeper violations
kubectl get constraints
```

### Monitoring Issues

```bash
# Restart monitoring stack
kubectl rollout restart deployment -n monitoring

# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Go to Status → Targets
```

## Next Steps

1. **Configure Alerting:**
   - Update Alertmanager with your email/Slack webhook
   - Test alert delivery

2. **Setup Vault:**
   - Move all secrets to Vault
   - Configure auto-rotation

3. **Review Security Reports:**
   - Generate daily security reports
   - Address critical findings

4. **Tune Policies:**
   - Review and adjust Kyverno/OPA policies
   - Add custom rules for your use case

5. **Load Testing:**
   - Run load tests to verify performance
   - Check if alerts fire correctly

## Support

For detailed instructions, see [SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md)

Questions? Contact: security@marketplace.com
