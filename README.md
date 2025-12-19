# 🔐 Secure Microservices-Based Online Marketplace Platform

[![Security](https://img.shields.io/badge/Security-OWASP%20ASVS%20v5-green)](https://owasp.org/www-project-application-security-verification-standard/)
[![Architecture](https://img.shields.io/badge/Architecture-Zero%20Trust-blue)](https://www.nist.gov/publications/zero-trust-architecture)
[![DevSecOps](https://img.shields.io/badge/DevSecOps-Enabled-orange)](https://www.devsecops.org/)

> **Course:** CYC386 – Secure Software Design & Development  
> **Institution:** COMSATS University Islamabad  
> **Semester:** Fall 2025

A production-grade, cloud-native, microservices-based online marketplace backend built with enterprise-level security controls, designed for live defense in a university lab examination.

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Security Controls](#-security-controls)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Security Testing](#-security-testing)
- [Monitoring](#-monitoring)

## ✨ Features

### Core Application Features
- **User Authentication & Identity Management** - Secure registration and JWT-based authentication
- **Role-Based Access Control (RBAC)** - Admin, Seller, and Buyer roles with granular permissions
- **Product Management** - Full CRUD operations with authorization
- **Order Management** - Secure order placement and tracking
- **Mock Payment Processing** - AES-256 encrypted payment simulation
- **Modern Frontend** - React-based responsive UI with Tailwind CSS

### Security Features
- ✅ **Zero Trust Architecture** - Every request verified
- ✅ **JWT Authentication** - Stateless authentication with refresh tokens
- ✅ **Input Validation** - OWASP-compliant validation and sanitization
- ✅ **Encryption** - AES-256-GCM for sensitive data
- ✅ **Secure Logging** - Centralized audit logging with sensitive data masking
- ✅ **Rate Limiting** - DDoS protection
- ✅ **Security Headers** - Helmet.js integration
- ✅ **SQL Injection Prevention** - Parameterized queries
- ✅ **XSS Protection** - Input sanitization
- ✅ **CSRF Protection** - Token-based protection

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │
┌──────┴──────────────────────────────┐
│      API Gateway / Ingress          │
└──────┬──────────────────────────────┘
       │
┌──────┴──────────────────────────────┐
│                                      │
│  ┌──────────┐  ┌──────────┐        │
│  │   Auth   │  │ Product  │        │
│  │ Service  │  │ Service  │        │
│  └────┬─────┘  └────┬─────┘        │
│       │             │               │
│  ┌────┴─────┐  ┌───┴──────┐       │
│  │  Order   │  │ Payment  │       │
│  │ Service  │  │ Service  │       │
│  └────┬─────┘  └────┬─────┘       │
│       │             │               │
└───────┼─────────────┼───────────────┘
        │             │
   ┌────┴─────────────┴────┐
   │    PostgreSQL DB      │
   └───────────────────────┘
```

### Microservices

| Service | Port | Description |
|---------|------|-------------|
| Auth Service | 3001 | User registration, login, JWT issuance |
| Product Service | 3002 | Product CRUD with RBAC |
| Order Service | 3003 | Order creation and management |
| Payment Service | 3004 | Mock payment processing with encryption |
| Frontend | 3000 | React application |

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js 20 (Express.js)
- **Database:** PostgreSQL 15
- **Authentication:** JWT (jsonwebtoken)
- **Encryption:** Crypto (AES-256-GCM)
- **Validation:** Validator.js
- **Logging:** Winston

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Routing:** React Router v6

### Infrastructure
- **Containerization:** Docker
- **Orchestration:** Kubernetes
- **Package Manager:** Helm
- **IaC:** Terraform
- **Secrets Management:** HashiCorp Vault
- **CI/CD:** GitHub Actions

### Security Tools
- **SAST:** SonarQube
- **DAST:** OWASP ZAP
- **Container Scanning:** Trivy
- **Policy Enforcement:** OPA/Kyverno
- **Runtime Security:** Falco

### Monitoring
- **Metrics:** Prometheus
- **Visualization:** Grafana
- **Logging:** Loki
- **Tracing:** Tempo

## 🔒 Security Controls

### OWASP ASVS v5 Compliance

| Category | Controls Implemented |
|----------|---------------------|
| V1: Architecture | Microservices, Defense-in-depth |
| V2: Authentication | JWT, Password hashing (PBKDF2), MFA-ready |
| V3: Session Management | Stateless JWT with refresh tokens |
| V4: Access Control | RBAC, Permission-based authorization |
| V5: Validation | Input validation, sanitization, output encoding |
| V6: Cryptography | AES-256-GCM, TLS, secure random generation |
| V7: Error Handling | Secure error messages, comprehensive logging |
| V8: Data Protection | Encryption at rest and in transit |
| V9: Communications | HTTPS, secure headers, CORS |
| V10: Malicious Code | CSP, input validation |

### NIST Cybersecurity Framework Alignment

- **Identify:** Asset inventory, risk assessment
- **Protect:** Access control, encryption, security training
- **Detect:** Continuous monitoring, logging, anomaly detection
- **Respond:** Incident response procedures
- **Recover:** Backup and recovery procedures

### STRIDE Threat Model Coverage

- **Spoofing:** JWT authentication, token validation
- **Tampering:** Input validation, integrity checks
- **Repudiation:** Audit logging, non-repudiation
- **Information Disclosure:** Encryption, access control
- **Denial of Service:** Rate limiting, resource quotas
- **Elevation of Privilege:** RBAC, least privilege principle

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose
- Kubernetes cluster (optional)
- Terraform (optional)

### Quick Start with Docker Compose

1. **Clone the repository:**
```bash
git clone <repository-url>
cd MicroService-based-Marketplace
```

2. **Create environment files:**
```bash
# Copy example env files for each service
cp services/auth-service/.env.example services/auth-service/.env
cp services/product-service/.env.example services/product-service/.env
cp services/order-service/.env.example services/order-service/.env
cp services/payment-service/.env.example services/payment-service/.env
```

3. **Generate secure secrets:**
```bash
# Generate JWT secret (minimum 32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key (32 bytes hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. **Update environment variables** in `.env` files with generated secrets

5. **Start all services:**
```bash
docker-compose -f docker/docker-compose.yml up -d
```

6. **Access the application:**
- Frontend: http://localhost:3000
- Auth Service: http://localhost:3001
- Product Service: http://localhost:3002
- Order Service: http://localhost:3003
- Payment Service: http://localhost:3004

### Database Initialization

The databases will be automatically initialized on first run. The schema includes:

**Auth Database:**
- users table (with password hashing)
- refresh_tokens table
- audit_logs table

**Product Database:**
- products table

**Order Database:**
- orders table

**Payment Database:**
- payments table (with encrypted payment data)

## 💻 Development

### Local Development Setup

1. **Install dependencies for all services:**
```bash
npm run install:all
```

2. **Start services in development mode:**
```bash
# Terminal 1 - Auth Service
npm run dev:auth

# Terminal 2 - Product Service
npm run dev:product

# Terminal 3 - Order Service
npm run dev:order

# Terminal 4 - Payment Service
npm run dev:payment

# Terminal 5 - Frontend
npm run dev:frontend
```

3. **Run tests:**
```bash
npm run test:all
```

4. **Run linting:**
```bash
npm run lint
```

### Project Structure

```
MicroService-based-Marketplace/
├── services/
│   ├── shared/              # Shared utilities and middleware
│   │   ├── utils/
│   │   │   ├── crypto.js    # Encryption utilities
│   │   │   ├── jwt.js       # JWT utilities
│   │   │   ├── validation.js # Input validation
│   │   │   └── logger.js    # Logging utilities
│   │   └── middleware/
│   │       ├── auth.js      # Authentication middleware
│   │       ├── rbac.js      # Authorization middleware
│   │       ├── security.js  # Security headers
│   │       └── errorHandler.js
│   ├── auth-service/
│   ├── product-service/
│   ├── order-service/
│   └── payment-service/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── lib/
├── docker/
│   ├── docker-compose.yml
│   └── Dockerfile.*
├── k8s/                     # Kubernetes manifests
├── helm/                    # Helm charts
├── iac/                     # Terraform configurations
├── ci/                      # CI/CD configurations
├── monitor/                 # Monitoring configs
└── docs/                    # Documentation
```

## 🚢 Deployment

### Docker Deployment

```bash
# Build all images
docker-compose -f docker/docker-compose.yml build

# Start services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down
```

### Kubernetes Deployment

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets
kubectl apply -f k8s/secrets.yaml

# Deploy database
kubectl apply -f k8s/postgres.yaml

# Deploy services
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/product-service.yaml
kubectl apply -f k8s/order-service.yaml
kubectl apply -f k8s/payment-service.yaml

# Deploy ingress
kubectl apply -f k8s/ingress.yaml

# Check deployment status
kubectl get pods -n marketplace
kubectl get services -n marketplace
```

### Terraform Infrastructure

```bash
cd iac

# Initialize Terraform
terraform init

# Plan infrastructure
terraform plan

# Apply infrastructure
terraform apply

# Destroy infrastructure
terraform destroy
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "role": "BUYER"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <access_token>
```

### Product Endpoints

#### Get All Products
```http
GET /products?page=1&limit=20&search=laptop
```

#### Create Product (Seller/Admin only)
```http
POST /products
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "stock": 10
}
```

### Order Endpoints

#### Create Order (Buyer only)
```http
POST /orders
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "productId": "uuid",
  "quantity": 2
}
```

#### Get My Orders
```http
GET /orders
Authorization: Bearer <access_token>
```

### Payment Endpoints

#### Process Payment (Mock)
```http
POST /payments/process
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "orderId": "uuid",
  "amount": 1999.98,
  "cardNumber": "4111111111111111"
}
```

## 🧪 Security Testing

### SAST (Static Application Security Testing)

```bash
# Run SonarQube scan
sonar-scanner -Dproject.settings=ci/sonar-project.properties
```

### DAST (Dynamic Application Security Testing)

```bash
# Run OWASP ZAP scan
zap-cli --verbose quick-scan --self-contained --start-options '-config api.disablekey=true' http://localhost:3000
```

### Container Security Scanning

```bash
# Scan images with Trivy
trivy image marketplace/auth-service:latest
trivy image marketplace/product-service:latest
```

### Penetration Testing Checklist

- [ ] SQL Injection testing
- [ ] XSS testing
- [ ] CSRF testing
- [ ] Authentication bypass attempts
- [ ] Authorization testing (RBAC)
- [ ] Session management testing
- [ ] Input validation testing
- [ ] Rate limiting testing
- [ ] Encryption verification

## 📊 Monitoring

### Prometheus Metrics

Access Prometheus at: `http://localhost:9090`

Key metrics:
- HTTP request duration
- Error rates
- Authentication failures
- Database connection pool stats
- Resource utilization

### Grafana Dashboards

Access Grafana at: `http://localhost:3000`

Default dashboards:
- Service Overview
- Security Events
- Database Performance
- System Resources

### Logging with Loki

Centralized logging available through Grafana

### Falco Runtime Security

Monitor runtime security events:
```bash
kubectl logs -n falco -l app=falco
```

## 📖 Additional Documentation

- [Security Architecture](docs/SECURITY.md)
- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Threat Model](docs/THREAT_MODEL.md)

## 🤝 Contributing

This is an academic project for CYC386. For contributions or questions, please contact the project team.

## 📄 License

This project is created for educational purposes as part of CYC386 coursework at COMSATS University Islamabad.

## 🔍 Security Disclosure

If you discover a security vulnerability, please email the project maintainers immediately. Do not create public issues for security vulnerabilities.

## 👥 Team

**Course:** CYC386 – Secure Software Design & Development  
**Institution:** COMSATS University Islamabad  
**Academic Year:** Fall 2025

---

Built with ❤️ and 🔒 by the CYC386 team
