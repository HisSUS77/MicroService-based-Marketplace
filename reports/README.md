# Security Reports Directory

This directory contains automated security reports generated from various security scanning tools.

## Report Types

### 1. Container Security (Trivy)
- Vulnerability scanning results for container images
- Identifies CVEs in dependencies and base images

### 2. SAST (SonarQube)
- Static application security testing results
- Code quality and security issues

### 3. IaC Compliance (Checkov)
- Infrastructure as Code security validation
- Terraform and Kubernetes manifests compliance

### 4. Runtime Security (Falco)
- Runtime threat detection events
- Suspicious system calls and container behavior

### 5. DAST (OWASP ZAP)
- Dynamic application security testing results
- API and web application vulnerabilities

## Report Format

Reports are generated in both JSON and HTML formats:
- `security-report-YYYY-MM-DDTHH-mm-ss.json` - Machine-readable format
- `security-report-YYYY-MM-DDTHH-mm-ss.html` - Human-readable format

## Usage

Generate a new security report:

```bash
node scripts/security-reporter.js
```

With custom paths:

```bash
TRIVY_RESULTS_PATH=./trivy.json \
CHECKOV_RESULTS_PATH=./checkov.json \
SONAR_RESULTS_PATH=./sonar.json \
FALCO_EVENTS_PATH=/var/log/falco/events.log \
node scripts/security-reporter.js
```

## Automated Generation

Reports are automatically generated:
- On every CI/CD pipeline run
- Daily via scheduled jobs
- After security scans complete

## Viewing Reports

1. Open the HTML report in a web browser
2. Review the executive summary
3. Check critical and high-priority recommendations
4. Follow remediation guidance

## Integration

Reports can be:
- Uploaded to artifact storage
- Sent via email
- Posted to Slack/Teams channels
- Integrated with SIEM systems
