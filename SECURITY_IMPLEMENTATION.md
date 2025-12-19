# 🔐 Security Implementation Guide

This guide provides step-by-step instructions for deploying all advanced security features.

## Table of Contents
1. [Policy-as-Code Setup](#1-policy-as-code-setup)
2. [Secrets Management](#2-secrets-management)
3. [IaC Compliance](#3-iac-compliance)
4. [Monitoring Stack](#4-monitoring-stack)
5. [Runtime Security](#5-runtime-security)
6. [Alerting](#6-alerting)
7. [Security Reporting](#7-security-reporting)
8. [CIS Benchmarks](#8-cis-benchmarks)

---

## 1. Policy-as-Code Setup

### Option A: Kyverno

**Install Kyverno:**
```bash
kubectl create -f https://github.com/kyverno/kyverno/releases/download/v1.11.0/install.yaml
```

**Deploy Policies:**
```bash
kubectl apply -f k8s/kyverno-policies.yaml
```

**Verify:**
```bash
kubectl get clusterpolicies
kubectl describe clusterpolicy disallow-privileged-containers
```

### Option B: OPA Gatekeeper

**Install OPA Gatekeeper:**
```bash
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/master/deploy/gatekeeper.yaml
```

**Deploy Constraints:**
```bash
kubectl apply -f k8s/opa-gatekeeper-constraints.yaml
```

**Verify:**
```bash
kubectl get constrainttemplates
kubectl get constraints
```

---

## 2. Secrets Management

### Option A: HashiCorp Vault

**Install Vault:**
```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault --set "server.dev.enabled=true"
```

**Initialize and Unseal:**
```bash
kubectl exec -it vault-0 -- vault operator init
kubectl exec -it vault-0 -- vault operator unseal <unseal-key>
```

**Store Secrets:**
```bash
# Login
kubectl exec -it vault-0 -- vault login <root-token>

# Write secrets
kubectl exec -it vault-0 -- vault kv put secret/marketplace/database/credentials \
  username=postgres \
  password=secure-password

kubectl exec -it vault-0 -- vault kv put secret/marketplace/jwt/key \
  secret=your-jwt-secret-key

kubectl exec -it vault-0 -- vault kv put secret/marketplace/encryption/key \
  key=your-encryption-key
```

**Update Service Configuration:**
```bash
# Set environment variables in each service deployment
export USE_VAULT=true
export VAULT_ADDR=http://vault:8200
export VAULT_TOKEN=<your-token>
export VAULT_NAMESPACE=marketplace
```

### Option B: Azure Key Vault (for Azure deployments)

**Configure in Terraform:**
```hcl
# Already configured in iac/main.tf
# Update secrets after deployment:

az keyvault secret set --vault-name marketplace-kv \
  --name db-password \
  --value "your-secure-password"

az keyvault secret set --vault-name marketplace-kv \
  --name jwt-secret \
  --value "your-jwt-secret"
```

---

## 3. IaC Compliance

### Checkov Integration

**Run Locally:**
```bash
pip install checkov
checkov -d ./iac --framework terraform
checkov -d ./k8s --framework kubernetes
checkov -d ./docker --framework dockerfile
```

**CI/CD Integration:**
Already configured in `.github/workflows/ci-cd.yml`

### Terraform Compliance

**Install:**
```bash
pip install terraform-compliance
```

**Run Tests:**
```bash
cd iac
terraform init
terraform plan -out=plan.out
terraform show -json plan.out > plan.json
terraform-compliance -p plan.json -f ../compliance-tests/
```

---

## 4. Monitoring Stack

### Deploy Prometheus, Grafana, and Loki

**Create Monitoring Namespace:**
```bash
kubectl create namespace monitoring
```

**Deploy Prometheus:**
```bash
kubectl apply -f k8s/monitoring/prometheus.yaml
```

**Deploy Grafana:**
```bash
kubectl apply -f k8s/monitoring/grafana.yaml
```

**Deploy Loki & Promtail:**
```bash
kubectl apply -f k8s/monitoring/loki.yaml
```

**Access Grafana:**
```bash
# Get Grafana URL
kubectl get svc grafana -n monitoring

# Default credentials: admin / change-this-password-in-production
# Change password immediately after first login
```

**Configure Dashboards:**
1. Login to Grafana
2. Add Prometheus datasource (already configured via ConfigMap)
3. Add Loki datasource (already configured)
4. Import pre-built dashboards:
   - Kubernetes Cluster Monitoring (ID: 7249)
   - Node Exporter (ID: 1860)
   - Custom Security Dashboard (included in ConfigMap)

**Verify Metrics:**
```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Open http://localhost:9090/targets

# Check Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000
# Open http://localhost:3000
```

---

## 5. Runtime Security

### Deploy Falco

**Deploy Falco:**
```bash
kubectl apply -f k8s/monitoring/falco.yaml
```

**Verify Deployment:**
```bash
kubectl get daemonset falco -n monitoring
kubectl logs -n monitoring -l app=falco --tail=50
```

**Monitor Events:**
```bash
# Watch Falco logs
kubectl logs -n monitoring -l app=falco -f

# Check events file
kubectl exec -n monitoring -l app=falco -- cat /var/log/falco/events.log
```

**Test Detection:**
```bash
# Trigger a test alert by spawning a shell in a container
kubectl exec -it <pod-name> -n marketplace -- /bin/sh
# This should trigger: "Shell Spawned in Container"
```

---

## 6. Alerting

### Deploy Alertmanager

**Deploy Alertmanager:**
```bash
kubectl apply -f k8s/monitoring/alertmanager.yaml
```

**Configure Notification Channels:**

Edit `k8s/monitoring/alertmanager.yaml` and update:

1. **Email Configuration:**
```yaml
smtp_smarthost: 'smtp.gmail.com:587'
smtp_from: 'your-email@gmail.com'
smtp_auth_username: 'your-email@gmail.com'
smtp_auth_password: 'your-app-password'
```

2. **Slack Configuration:**
```yaml
slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
```

**Reapply Configuration:**
```bash
kubectl apply -f k8s/monitoring/alertmanager.yaml
kubectl rollout restart deployment/alertmanager -n monitoring
```

**Test Alerts:**
```bash
# Send test alert
curl -H 'Content-Type: application/json' -d '[
  {
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning"
    },
    "annotations": {
      "summary": "Test alert from manual trigger"
    }
  }
]' http://localhost:9093/api/v1/alerts
```

**Verify Alert Routing:**
```bash
kubectl logs -n monitoring deployment/alertmanager
```

---

## 7. Security Reporting

### Setup Reporting System

**Install Dependencies:**
```bash
cd scripts
npm install
```

**Run Manual Report:**
```bash
node scripts/security-reporter.js
```

**Schedule Automated Reports:**

Create a CronJob for daily reports:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: security-report
  namespace: monitoring
spec:
  schedule: "0 6 * * *"  # Daily at 6 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: reporter
            image: node:20-alpine
            command:
            - /bin/sh
            - -c
            - |
              cd /app
              npm install
              node security-reporter.js
            volumeMounts:
            - name: scripts
              mountPath: /app
            - name: reports
              mountPath: /reports
          volumes:
          - name: scripts
            configMap:
              name: security-scripts
          - name: reports
            persistentVolumeClaim:
              claimName: reports-storage
          restartPolicy: OnFailure
```

**View Reports:**
```bash
# Access reports directory
ls reports/

# Open HTML report in browser
open reports/security-report-latest.html
```

---

## 8. CIS Benchmarks

### Docker Bench Security

**Run Docker Bench:**
```bash
docker run --rm --net host --pid host --userns host --cap-add audit_control \
  -v /etc:/etc:ro \
  -v /usr/bin/containerd:/usr/bin/containerd:ro \
  -v /usr/bin/runc:/usr/bin/runc:ro \
  -v /usr/lib/systemd:/usr/lib/systemd:ro \
  -v /var/lib:/var/lib:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  --label docker_bench_security \
  docker/docker-bench-security
```

### Kube-bench

**Run Kube-bench:**
```bash
# For managed Kubernetes (AKS, EKS, GKE)
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml

# Check results
kubectl logs -l app=kube-bench

# For custom Kubernetes
docker run --rm -v `pwd`:/host aquasec/kube-bench:latest \
  --config-dir /host/k8s --benchmark cis-1.8
```

### Automated CIS Compliance

Already integrated in CI/CD pipeline. Check results in GitHub Actions:
- Docker Bench results: Download from artifacts
- Kube-bench results: Download from artifacts

---

## Verification Checklist

After completing all steps, verify:

- [ ] Kyverno/OPA policies are active and enforcing
- [ ] Vault is storing and serving secrets correctly
- [ ] Checkov runs in CI/CD without critical failures
- [ ] Prometheus is scraping all services
- [ ] Grafana dashboards show metrics
- [ ] Loki is collecting logs from all pods
- [ ] Falco is detecting security events
- [ ] Alertmanager sends notifications to configured channels
- [ ] Security reports are generated successfully
- [ ] CIS benchmark scans run and results are available

---

## Monitoring Commands

**Check All Security Components:**
```bash
# Policy enforcement
kubectl get clusterpolicies
kubectl get constraints

# Monitoring stack
kubectl get all -n monitoring

# Check for security alerts
kubectl logs -n monitoring deployment/alertmanager | grep firing

# View security events
kubectl logs -n monitoring daemonset/falco | grep Priority:Critical
```

**Generate Test Data:**
```bash
# Trigger auth failures
for i in {1..20}; do curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@email.com","password":"wrongpass"}'; done

# Check if alert fires
kubectl logs -n monitoring deployment/alertmanager | grep HighAuthFailureRate
```

---

## Troubleshooting

### Vault Connection Issues
```bash
# Check Vault status
kubectl exec -it vault-0 -- vault status

# Check service connectivity
kubectl run test --rm -it --image=curlimages/curl -- \
  curl http://vault:8200/v1/sys/health
```

### Prometheus Not Scraping
```bash
# Check service discovery
kubectl logs -n monitoring deployment/prometheus | grep "scrape"

# Verify service annotations
kubectl get svc -n marketplace -o yaml | grep prometheus
```

### Falco Not Detecting Events
```bash
# Check Falco driver
kubectl logs -n monitoring daemonset/falco | grep driver

# Verify rules loaded
kubectl exec -n monitoring -l app=falco -- falco --list
```

### Alertmanager Not Sending Alerts
```bash
# Check configuration
kubectl get configmap alertmanager-config -n monitoring -o yaml

# Test SMTP connectivity
kubectl run smtp-test --rm -it --image=nicolaka/netshoot -- \
  nc -zv smtp.gmail.com 587
```

---

## Additional Resources

- [Kyverno Documentation](https://kyverno.io/docs/)
- [OPA Gatekeeper](https://open-policy-agent.github.io/gatekeeper/)
- [Vault Documentation](https://developer.hashicorp.com/vault/docs)
- [Prometheus Operator](https://prometheus-operator.dev/)
- [Falco Rules](https://falco.org/docs/rules/)
- [Alertmanager Configuration](https://prometheus.io/docs/alerting/latest/configuration/)

---

## Support

For issues or questions:
1. Check logs: `kubectl logs -n monitoring <pod-name>`
2. Review configurations in `k8s/monitoring/`
3. Consult the troubleshooting section above
4. Contact security team: security@marketplace.com
