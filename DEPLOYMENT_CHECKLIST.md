# 📋 Security Deployment Checklist

Use this checklist to ensure all security components are properly deployed and configured.

## Pre-Deployment

### Environment Setup
- [ ] Kubernetes cluster is running (v1.24+)
- [ ] kubectl configured and connected
- [ ] Helm 3.x installed
- [ ] Docker installed and running
- [ ] Node.js 20+ installed
- [ ] Sufficient cluster resources (16+ CPU cores, 32+ GB RAM)

### Secrets Preparation
- [ ] Generate strong JWT secret (min 32 characters)
- [ ] Generate encryption key (32 bytes hex)
- [ ] Generate database passwords
- [ ] Prepare SMTP credentials for alerting
- [ ] Prepare Slack webhook URLs (optional)

## Core Infrastructure Deployment

### Namespaces
- [ ] Create `marketplace` namespace
- [ ] Create `monitoring` namespace
- [ ] Apply RBAC policies

### Database
- [ ] Deploy PostgreSQL
- [ ] Verify database is running
- [ ] Initialize database schemas
- [ ] Verify connectivity

### Secrets
- [ ] Update secrets with generated values
- [ ] Apply secrets to cluster
- [ ] Verify secrets are created

## Security Policy Deployment

### Policy Engine (Choose One)

#### Option A: Kyverno
- [ ] Install Kyverno
- [ ] Verify Kyverno webhook is ready
- [ ] Apply Kyverno policies
- [ ] Test policy enforcement
- [ ] Check policy reports

#### Option B: OPA Gatekeeper
- [ ] Install OPA Gatekeeper
- [ ] Verify Gatekeeper webhook is ready
- [ ] Apply constraint templates
- [ ] Apply constraints
- [ ] Test policy enforcement

### Network Policies
- [ ] Apply network policies
- [ ] Verify pod-to-pod communication
- [ ] Test egress rules

## Secrets Management Deployment

### HashiCorp Vault (Recommended)
- [ ] Deploy Vault using Helm
- [ ] Initialize Vault
- [ ] Unseal Vault (3 unseal keys)
- [ ] Login with root token
- [ ] Create secret paths
- [ ] Store database credentials
- [ ] Store JWT secrets
- [ ] Store encryption keys
- [ ] Configure service access policies
- [ ] Enable auto-rotation (optional)

### Alternative: Azure Key Vault
- [ ] Deploy infrastructure using Terraform
- [ ] Configure Key Vault access policies
- [ ] Store secrets in Key Vault
- [ ] Configure service managed identities

## Monitoring Stack Deployment

### Prometheus
- [ ] Apply Prometheus configuration
- [ ] Verify Prometheus is running
- [ ] Check service discovery
- [ ] Verify targets are being scraped
- [ ] Load custom alert rules
- [ ] Test alert rule evaluation

### Grafana
- [ ] Deploy Grafana
- [ ] Access Grafana UI
- [ ] Change default admin password
- [ ] Verify Prometheus datasource
- [ ] Import dashboards
- [ ] Create security monitoring dashboard
- [ ] Configure user access

### Loki + Promtail
- [ ] Deploy Loki StatefulSet
- [ ] Deploy Promtail DaemonSet
- [ ] Verify logs are being collected
- [ ] Check Loki datasource in Grafana
- [ ] Test log queries
- [ ] Set up log retention

### Alertmanager
- [ ] Deploy Alertmanager
- [ ] Configure SMTP settings
- [ ] Configure Slack integration
- [ ] Set up routing rules
- [ ] Test email notifications
- [ ] Test Slack notifications
- [ ] Configure inhibition rules

## Runtime Security Deployment

### Falco
- [ ] Deploy Falco DaemonSet
- [ ] Verify Falco is running on all nodes
- [ ] Check kernel module loading
- [ ] Load custom rules
- [ ] Test detection (spawn shell)
- [ ] Verify events are logged
- [ ] Configure Falco → Alertmanager integration

## Application Services Deployment

### Microservices
- [ ] Build Docker images
- [ ] Scan images with Trivy
- [ ] Push images to registry
- [ ] Deploy auth-service
- [ ] Deploy product-service
- [ ] Deploy order-service
- [ ] Deploy payment-service
- [ ] Verify all services are running

### Service Configuration
- [ ] Configure Vault integration
- [ ] Update environment variables
- [ ] Configure service-to-service auth
- [ ] Apply resource limits
- [ ] Configure health checks

### Ingress
- [ ] Deploy Ingress controller
- [ ] Apply Ingress rules
- [ ] Configure TLS certificates
- [ ] Test external access
- [ ] Verify HTTPS enforcement

## CI/CD Pipeline Setup

### GitHub Actions
- [ ] Add KUBE_CONFIG secret
- [ ] Add SONAR_TOKEN secret
- [ ] Add SONAR_HOST_URL secret
- [ ] Add container registry credentials
- [ ] Test security scanning job
- [ ] Test IaC compliance job
- [ ] Test CIS benchmarks job
- [ ] Test build and deploy job

### Security Scanning
- [ ] Verify Trivy scans run
- [ ] Verify Checkov scans run
- [ ] Verify SonarQube scans run
- [ ] Check SARIF reports upload
- [ ] Review security findings

## Security Reporting

### Report Generator
- [ ] Install Node.js dependencies
- [ ] Configure report paths
- [ ] Test manual report generation
- [ ] Verify JSON report creation
- [ ] Verify HTML report creation
- [ ] Set up scheduled reports (CronJob)

## Testing & Validation

### Policy Enforcement Tests
- [ ] Test privileged container blocking
- [ ] Test missing resource limits blocking
- [ ] Test unapproved image registry blocking
- [ ] Test latest tag blocking
- [ ] Review policy reports

### Authentication Tests
- [ ] Test user registration
- [ ] Test user login
- [ ] Test JWT validation
- [ ] Test token expiration
- [ ] Test refresh token flow
- [ ] Test rate limiting

### Authorization Tests
- [ ] Test ADMIN role permissions
- [ ] Test SELLER role permissions
- [ ] Test BUYER role permissions
- [ ] Test unauthorized access blocking

### Security Detection Tests
- [ ] Trigger shell spawn detection
- [ ] Trigger suspicious file access
- [ ] Trigger failed login alerts
- [ ] Verify Falco events are logged
- [ ] Verify alerts are fired

### Monitoring Tests
- [ ] Verify metrics are collected
- [ ] Check Grafana dashboards
- [ ] Test log queries in Loki
- [ ] Generate load and check metrics
- [ ] Verify alert firing

### Alerting Tests
- [ ] Trigger high auth failure alert
- [ ] Trigger high error rate alert
- [ ] Trigger service down alert
- [ ] Verify email delivery
- [ ] Verify Slack notifications

## Performance Validation

### Load Testing
- [ ] Run load tests on services
- [ ] Monitor resource usage
- [ ] Check for performance degradation
- [ ] Verify autoscaling (if configured)
- [ ] Check alert firing under load

### Resource Monitoring
- [ ] Monitor CPU usage
- [ ] Monitor memory usage
- [ ] Monitor disk I/O
- [ ] Monitor network traffic
- [ ] Check for resource limits

## Documentation & Training

### Documentation
- [ ] Review README.md
- [ ] Review SECURITY_IMPLEMENTATION.md
- [ ] Review DEPLOYMENT.md
- [ ] Create runbooks for common issues
- [ ] Document custom configurations

### Team Training
- [ ] Train on Prometheus/Grafana
- [ ] Train on Falco events
- [ ] Train on incident response
- [ ] Train on security best practices
- [ ] Train on reporting system

## Post-Deployment

### Security Hardening
- [ ] Rotate all default passwords
- [ ] Remove default accounts
- [ ] Enable audit logging
- [ ] Configure backup procedures
- [ ] Set up disaster recovery

### Monitoring Setup
- [ ] Configure dashboards
- [ ] Set up on-call rotations
- [ ] Configure escalation policies
- [ ] Test incident response procedures

### Compliance
- [ ] Run full security scan
- [ ] Generate compliance report
- [ ] Address critical findings
- [ ] Document compliance status

### Maintenance Schedule
- [ ] Set up daily security reviews
- [ ] Schedule weekly report generation
- [ ] Plan monthly secret rotation
- [ ] Schedule quarterly audits

## Final Verification

### Health Checks
- [ ] All pods are running
- [ ] All services are accessible
- [ ] No policy violations
- [ ] No critical alerts
- [ ] Monitoring is operational

### Security Validation
- [ ] Authentication works
- [ ] Authorization works
- [ ] Encryption is enabled
- [ ] Logs are being collected
- [ ] Alerts are configured
- [ ] Policies are enforced

### Performance Check
- [ ] Response times are acceptable
- [ ] No resource bottlenecks
- [ ] Autoscaling works (if configured)
- [ ] Database performance is good

## Sign-Off

### Deployment Team
- [ ] Infrastructure team approval
- [ ] Security team approval
- [ ] Development team approval
- [ ] Operations team approval

### Go-Live Checklist
- [ ] All deployment steps completed
- [ ] All tests passed
- [ ] Documentation updated
- [ ] Team trained
- [ ] Monitoring configured
- [ ] Incident response ready
- [ ] Backup/DR configured

---

## Troubleshooting Quick Reference

### Common Issues

**Pods Not Starting:**
```bash
kubectl describe pod <pod-name> -n marketplace
kubectl logs <pod-name> -n marketplace
```

**Policy Violations:**
```bash
kubectl get policyreport -A
kubectl describe policyreport <report-name>
```

**Monitoring Issues:**
```bash
kubectl logs -n monitoring deployment/prometheus
kubectl get servicemonitor -n monitoring
```

**Falco Not Detecting:**
```bash
kubectl logs -n monitoring daemonset/falco | grep driver
kubectl exec -n monitoring -l app=falco -- falco --list
```

**Alertmanager Not Sending:**
```bash
kubectl logs -n monitoring deployment/alertmanager
kubectl port-forward -n monitoring svc/alertmanager 9093:9093
# Check http://localhost:9093
```

---

## Support Contacts

- **Security Team:** security@marketplace.com
- **DevOps Team:** devops@marketplace.com
- **On-Call:** oncall@marketplace.com

## Emergency Procedures

In case of security incident:
1. Contact on-call team immediately
2. Check Falco logs for suspicious activities
3. Review Alertmanager alerts
4. Generate immediate security report
5. Follow incident response playbook

---

**Document Version:** 1.0  
**Last Updated:** December 20, 2025  
**Next Review:** January 20, 2026
