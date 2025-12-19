# EC2 Deployment Guide for Secure Marketplace Platform

## Prerequisites

### EC2 Instance Requirements
- **Instance Type:** t3.xlarge or larger (4 vCPU, 16GB RAM minimum)
- **OS:** Ubuntu 20.04 or 22.04 LTS
- **Storage:** 50GB+ EBS volume
- **Security Group:** Open ports 22, 3000, 9090, 9093, 3001, 3002, 6443

### Recommended Instance Types
- **Development:** t3.xlarge (4 vCPU, 16GB RAM)
- **Production:** t3.2xlarge (8 vCPU, 32GB RAM) or m5.2xlarge

## Quick Deployment

### 1. Launch EC2 Instance

```bash
# Using AWS CLI
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.xlarge \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxx \
  --subnet-id subnet-xxxxxxxx \
  --block-device-mappings DeviceName=/dev/sda1,Ebs={VolumeSize=50} \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=marketplace-platform}]'
```

### 2. Connect to Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 3. Clone Repository

```bash
git clone https://github.com/your-org/MicroService-based-Marketplace.git
cd MicroService-based-Marketplace
```

### 4. Run Deployment Script

```bash
chmod +x deploy-ec2.sh
sudo ./deploy-ec2.sh
```

**Note:** The script will take approximately 20-30 minutes to complete.

## What Gets Installed

### System Components
- ✅ Docker CE 24.x
- ✅ Kubernetes 1.28 (kubeadm, kubelet, kubectl)
- ✅ Flannel CNI
- ✅ Helm 3.x
- ✅ Node.js 20

### Security Layer
- ✅ Kyverno Policy Engine
- ✅ Network Policies
- ✅ OPA Gatekeeper (optional)

### Monitoring Stack
- ✅ Prometheus (metrics collection)
- ✅ Grafana (visualization)
- ✅ Loki (log aggregation)
- ✅ Promtail (log shipping)
- ✅ Alertmanager (alerting)

### Security Monitoring
- ✅ Falco (runtime security)
- ✅ Security dashboards
- ✅ Alert rules

### Application Services
- ✅ PostgreSQL database
- ✅ Auth service
- ✅ Product service
- ✅ Order service (if configured)
- ✅ Payment service (if configured)

### Optional Components
- HashiCorp Vault (prompted during installation)

## Post-Deployment Steps

### 1. Verify Installation

```bash
# Check cluster status
kubectl cluster-info
kubectl get nodes
kubectl get pods -A

# Check services
kubectl get svc -A

# Check policies
kubectl get clusterpolicies
```

### 2. Access Grafana

```bash
# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me)

# Open in browser
echo "Grafana: http://$PUBLIC_IP:3000"

# Default credentials
# Username: admin
# Password: change-this-password-in-production
```

### 3. Change Default Passwords

```bash
# Change Grafana password
# Login to Grafana -> Profile -> Change Password

# Update Kubernetes secrets
kubectl edit secret marketplace-secrets -n marketplace
kubectl edit secret grafana-credentials -n monitoring
```

### 4. Configure Alerting

```bash
# Edit Alertmanager configuration
kubectl edit configmap alertmanager-config -n monitoring

# Update with your SMTP settings and Slack webhook
# Then restart Alertmanager
kubectl rollout restart deployment/alertmanager -n monitoring
```

### 5. Test Services

```bash
# Test auth service
curl http://localhost:3001/health

# Test product service
curl http://localhost:3002/health

# Register a user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "role": "BUYER"
  }'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

## Security Group Configuration

### Required Inbound Rules

| Port | Protocol | Source | Description |
|------|----------|--------|-------------|
| 22 | TCP | Your IP | SSH access |
| 3000 | TCP | 0.0.0.0/0 | Grafana dashboard |
| 9090 | TCP | 0.0.0.0/0 | Prometheus |
| 9093 | TCP | 0.0.0.0/0 | Alertmanager |
| 3001 | TCP | 0.0.0.0/0 | Auth service |
| 3002 | TCP | 0.0.0.0/0 | Product service |
| 6443 | TCP | Your IP | Kubernetes API |

**Production Note:** Restrict access to your IP ranges instead of 0.0.0.0/0

## Resource Monitoring

### Check Resource Usage

```bash
# Node resources
kubectl top nodes

# Pod resources
kubectl top pods -A

# Detailed pod info
kubectl describe node $(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
```

### Adjust Resource Limits

```bash
# Edit deployment
kubectl edit deployment auth-service -n marketplace

# Update resources section:
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n marketplace
kubectl describe pod <pod-name> -n marketplace

# Check logs
kubectl logs <pod-name> -n marketplace

# Check events
kubectl get events -n marketplace --sort-by='.lastTimestamp'
```

### Out of Memory

```bash
# Check memory usage
free -h
kubectl top nodes

# Reduce pod replicas
kubectl scale deployment/auth-service --replicas=1 -n marketplace

# Or upgrade instance type
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Clean Docker images
docker system prune -a

# Clean old Kubernetes resources
kubectl delete pod --field-selector=status.phase==Failed -A
```

### Port Forwarding Not Working

```bash
# Check systemd service
sudo systemctl status k8s-port-forward

# Restart service
sudo systemctl restart k8s-port-forward

# Manual port forward
kubectl port-forward -n monitoring svc/grafana 3000:3000 --address=0.0.0.0
```

### Kubernetes Cluster Issues

```bash
# Reset cluster (WARNING: Deletes all data)
sudo kubeadm reset
sudo rm -rf /etc/cni/net.d
sudo rm -rf $HOME/.kube

# Re-run deployment script
sudo ./deploy-ec2.sh
```

## Performance Optimization

### For Larger Instances

```bash
# Increase pod replicas
kubectl scale deployment/auth-service --replicas=3 -n marketplace
kubectl scale deployment/product-service --replicas=3 -n marketplace

# Enable horizontal pod autoscaling
kubectl autoscale deployment auth-service --cpu-percent=50 --min=2 --max=10 -n marketplace
```

### Database Optimization

```bash
# Adjust PostgreSQL resources
kubectl edit statefulset postgres -n marketplace

# Increase storage
kubectl patch pvc postgres-data -n marketplace -p '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'
```

## Backup and Recovery

### Backup etcd

```bash
# Backup etcd data
sudo ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-snapshot.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
```

### Backup Database

```bash
# Backup PostgreSQL
kubectl exec -n marketplace postgres-0 -- pg_dumpall -U postgres > /backup/postgres-backup.sql
```

### Create AMI

```bash
# Stop services
kubectl delete namespace marketplace
kubectl delete namespace monitoring

# Create AMI from AWS Console or CLI
aws ec2 create-image \
  --instance-id i-xxxxxxxxx \
  --name "marketplace-platform-$(date +%Y%m%d)" \
  --description "Marketplace platform with all services"
```

## Scaling Guide

### Vertical Scaling (Larger Instance)

1. Stop instance
2. Change instance type
3. Start instance
4. Verify services

### Horizontal Scaling (Multi-Node)

For production, use managed Kubernetes (EKS):

```bash
# Create EKS cluster
eksctl create cluster \
  --name marketplace-cluster \
  --region us-east-1 \
  --nodes 3 \
  --node-type t3.xlarge

# Deploy application
kubectl apply -f k8s/
```

## Cost Optimization

### Stop Non-Production Services

```bash
# Scale down to 0 replicas
kubectl scale deployment --replicas=0 --all -n marketplace

# Stop instance when not in use
aws ec2 stop-instances --instance-ids i-xxxxxxxxx
```

### Use Spot Instances

For development, use spot instances to save costs:
- 70-90% cost savings
- Suitable for non-critical workloads

## Monitoring and Alerts

### Access Dashboards

- **Grafana:** http://your-ec2-ip:3000
- **Prometheus:** http://your-ec2-ip:9090
- **Alertmanager:** http://your-ec2-ip:9093

### View Logs

```bash
# Application logs
kubectl logs -f -n marketplace deployment/auth-service

# Falco security events
kubectl logs -f -n monitoring daemonset/falco | grep Priority

# System logs
journalctl -u kubelet -f
```

### Generate Security Report

```bash
cd /home/ubuntu/MicroService-based-Marketplace
node scripts/security-reporter.js

# View report
ls reports/
```

## Support and Maintenance

### Regular Maintenance Tasks

**Daily:**
- Check Grafana dashboards
- Review Falco security events
- Monitor resource usage

**Weekly:**
- Update system packages: `sudo apt update && sudo apt upgrade`
- Generate security reports
- Review and rotate logs

**Monthly:**
- Backup etcd and databases
- Review and update security policies
- Check for Kubernetes updates

### Getting Help

- View logs: `kubectl logs -n <namespace> <pod-name>`
- Describe resources: `kubectl describe <resource> -n <namespace>`
- Check events: `kubectl get events -A`
- Documentation: See SECURITY_IMPLEMENTATION.md

## Production Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Configure TLS/SSL certificates
- [ ] Set up proper DNS records
- [ ] Configure backup strategy
- [ ] Enable AWS CloudWatch monitoring
- [ ] Set up log retention policies
- [ ] Configure Alertmanager notifications
- [ ] Review and harden security groups
- [ ] Enable AWS Backup
- [ ] Set up multi-AZ deployment (for HA)
- [ ] Configure auto-scaling groups
- [ ] Set up disaster recovery plan
- [ ] Document access controls
- [ ] Perform security audit
- [ ] Load testing

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS EC2 Best Practices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-best-practices.html)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/docs/)
- [Falco Rules](https://falco.org/docs/rules/)

---

**Deployment Time:** ~20-30 minutes  
**Estimated Cost:** $100-200/month (t3.xlarge, 24/7)  
**Support:** See SECURITY_IMPLEMENTATION.md for detailed guides
