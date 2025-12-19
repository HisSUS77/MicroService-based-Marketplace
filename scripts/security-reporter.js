#!/usr/bin/env node

/**
 * Security Reporting System
 * Aggregates and generates comprehensive security reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SecurityReporter {
  constructor() {
    this.reportDir = path.join(__dirname, '..', 'reports');
    this.timestamp = new Date().toISOString();
    
    // Ensure report directory exists
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * Parse Trivy scan results
   */
  parseTrivyResults(filePath) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const vulnerabilities = {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
        details: []
      };

      if (data.Results) {
        data.Results.forEach(result => {
          if (result.Vulnerabilities) {
            result.Vulnerabilities.forEach(vuln => {
              vulnerabilities[vuln.Severity]++;
              vulnerabilities.details.push({
                id: vuln.VulnerabilityID,
                severity: vuln.Severity,
                package: vuln.PkgName,
                version: vuln.InstalledVersion,
                fixedVersion: vuln.FixedVersion,
                title: vuln.Title
              });
            });
          }
        });
      }

      return vulnerabilities;
    } catch (error) {
      console.error(`Error parsing Trivy results: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse Checkov results
   */
  parseCheckovResults(filePath) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const summary = {
        passed: data.summary?.passed || 0,
        failed: data.summary?.failed || 0,
        skipped: data.summary?.skipped || 0,
        findings: []
      };

      if (data.results?.failed_checks) {
        data.results.failed_checks.forEach(check => {
          summary.findings.push({
            checkId: check.check_id,
            checkName: check.check_name,
            resource: check.resource,
            file: check.file_path,
            severity: check.severity || 'MEDIUM'
          });
        });
      }

      return summary;
    } catch (error) {
      console.error(`Error parsing Checkov results: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse SonarQube results
   */
  parseSonarQubeResults(filePath) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return {
        bugs: data.measures?.find(m => m.metric === 'bugs')?.value || 0,
        vulnerabilities: data.measures?.find(m => m.metric === 'vulnerabilities')?.value || 0,
        codeSmells: data.measures?.find(m => m.metric === 'code_smells')?.value || 0,
        securityHotspots: data.measures?.find(m => m.metric === 'security_hotspots')?.value || 0,
        coverage: data.measures?.find(m => m.metric === 'coverage')?.value || 0,
        duplications: data.measures?.find(m => m.metric === 'duplicated_lines_density')?.value || 0
      };
    } catch (error) {
      console.error(`Error parsing SonarQube results: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse Falco events
   */
  parseFalcoEvents(filePath) {
    try {
      const events = fs.readFileSync(filePath, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(event => event !== null);

      const summary = {
        total: events.length,
        critical: events.filter(e => e.priority === 'Critical').length,
        warning: events.filter(e => e.priority === 'Warning').length,
        notice: events.filter(e => e.priority === 'Notice').length,
        topRules: {}
      };

      events.forEach(event => {
        const rule = event.rule || 'Unknown';
        summary.topRules[rule] = (summary.topRules[rule] || 0) + 1;
      });

      return summary;
    } catch (error) {
      console.error(`Error parsing Falco events: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate comprehensive security report
   */
  generateReport(options = {}) {
    const report = {
      metadata: {
        timestamp: this.timestamp,
        reportType: 'Security Assessment',
        version: '1.0.0'
      },
      summary: {
        overallRiskLevel: 'UNKNOWN',
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0
      },
      sast: null,
      dast: null,
      containerSecurity: null,
      iacCompliance: null,
      runtimeSecurity: null,
      recommendations: []
    };

    // Parse SAST results (SonarQube)
    if (options.sastPath && fs.existsSync(options.sastPath)) {
      report.sast = this.parseSonarQubeResults(options.sastPath);
    }

    // Parse container security (Trivy)
    if (options.trivyPath && fs.existsSync(options.trivyPath)) {
      report.containerSecurity = this.parseTrivyResults(options.trivyPath);
      if (report.containerSecurity) {
        report.summary.criticalIssues += report.containerSecurity.CRITICAL;
        report.summary.highIssues += report.containerSecurity.HIGH;
        report.summary.mediumIssues += report.containerSecurity.MEDIUM;
        report.summary.lowIssues += report.containerSecurity.LOW;
      }
    }

    // Parse IaC compliance (Checkov)
    if (options.checkovPath && fs.existsSync(options.checkovPath)) {
      report.iacCompliance = this.parseCheckovResults(options.checkovPath);
      if (report.iacCompliance) {
        report.summary.criticalIssues += report.iacCompliance.findings.filter(f => f.severity === 'CRITICAL').length;
        report.summary.highIssues += report.iacCompliance.findings.filter(f => f.severity === 'HIGH').length;
      }
    }

    // Parse runtime security (Falco)
    if (options.falcoPath && fs.existsSync(options.falcoPath)) {
      report.runtimeSecurity = this.parseFalcoEvents(options.falcoPath);
      if (report.runtimeSecurity) {
        report.summary.criticalIssues += report.runtimeSecurity.critical;
        report.summary.highIssues += report.runtimeSecurity.warning;
      }
    }

    // Determine overall risk level
    if (report.summary.criticalIssues > 0) {
      report.summary.overallRiskLevel = 'CRITICAL';
    } else if (report.summary.highIssues > 10) {
      report.summary.overallRiskLevel = 'HIGH';
    } else if (report.summary.mediumIssues > 20) {
      report.summary.overallRiskLevel = 'MEDIUM';
    } else {
      report.summary.overallRiskLevel = 'LOW';
    }

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  /**
   * Generate recommendations based on findings
   */
  generateRecommendations(report) {
    const recommendations = [];

    if (report.containerSecurity?.CRITICAL > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Container Security',
        issue: `${report.containerSecurity.CRITICAL} critical vulnerabilities found`,
        recommendation: 'Update vulnerable packages immediately and rescan images'
      });
    }

    if (report.iacCompliance?.failed > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Infrastructure Compliance',
        issue: `${report.iacCompliance.failed} IaC compliance checks failed`,
        recommendation: 'Review and fix infrastructure code according to security best practices'
      });
    }

    if (report.runtimeSecurity?.critical > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Runtime Security',
        issue: `${report.runtimeSecurity.critical} critical runtime events detected`,
        recommendation: 'Investigate suspicious runtime activities immediately'
      });
    }

    if (report.sast?.vulnerabilities > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Application Security',
        issue: `${report.sast.vulnerabilities} vulnerabilities found in source code`,
        recommendation: 'Address code-level security issues and apply secure coding practices'
      });
    }

    return recommendations;
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Assessment Report - ${report.metadata.timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
        .card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .card.critical { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .card.high { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        .card.medium { background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); }
        .card.low { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
        .card h3 { margin: 0; font-size: 14px; }
        .card p { margin: 10px 0 0 0; font-size: 36px; font-weight: bold; }
        .risk-level { display: inline-block; padding: 10px 20px; border-radius: 5px; font-weight: bold; color: white; }
        .risk-CRITICAL { background: #f5576c; }
        .risk-HIGH { background: #ff9800; }
        .risk-MEDIUM { background: #2196f3; }
        .risk-LOW { background: #4caf50; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        .recommendation { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .recommendation.critical { background: #f8d7da; border-color: #dc3545; }
        .recommendation.high { background: #fff3cd; border-color: #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔒 Security Assessment Report</h1>
        <p><strong>Generated:</strong> ${new Date(report.metadata.timestamp).toLocaleString()}</p>
        <p><strong>Overall Risk Level:</strong> <span class="risk-level risk-${report.summary.overallRiskLevel}">${report.summary.overallRiskLevel}</span></p>
        
        <h2>📊 Executive Summary</h2>
        <div class="summary">
            <div class="card critical">
                <h3>Critical Issues</h3>
                <p>${report.summary.criticalIssues}</p>
            </div>
            <div class="card high">
                <h3>High Issues</h3>
                <p>${report.summary.highIssues}</p>
            </div>
            <div class="card medium">
                <h3>Medium Issues</h3>
                <p>${report.summary.mediumIssues}</p>
            </div>
            <div class="card low">
                <h3>Low Issues</h3>
                <p>${report.summary.lowIssues}</p>
            </div>
        </div>

        <h2>🎯 Key Recommendations</h2>
        ${report.recommendations.map(rec => `
            <div class="recommendation ${rec.priority.toLowerCase()}">
                <strong>[${rec.priority}] ${rec.category}</strong><br>
                <strong>Issue:</strong> ${rec.issue}<br>
                <strong>Recommendation:</strong> ${rec.recommendation}
            </div>
        `).join('')}

        ${report.containerSecurity ? `
        <h2>🐳 Container Security (Trivy)</h2>
        <table>
            <tr>
                <th>Severity</th>
                <th>Count</th>
            </tr>
            <tr><td>Critical</td><td>${report.containerSecurity.CRITICAL}</td></tr>
            <tr><td>High</td><td>${report.containerSecurity.HIGH}</td></tr>
            <tr><td>Medium</td><td>${report.containerSecurity.MEDIUM}</td></tr>
            <tr><td>Low</td><td>${report.containerSecurity.LOW}</td></tr>
        </table>
        ` : ''}

        ${report.iacCompliance ? `
        <h2>🏗️ Infrastructure Compliance (Checkov)</h2>
        <table>
            <tr>
                <th>Status</th>
                <th>Count</th>
            </tr>
            <tr><td>Passed</td><td>${report.iacCompliance.passed}</td></tr>
            <tr><td>Failed</td><td>${report.iacCompliance.failed}</td></tr>
            <tr><td>Skipped</td><td>${report.iacCompliance.skipped}</td></tr>
        </table>
        ` : ''}

        ${report.runtimeSecurity ? `
        <h2>⚡ Runtime Security (Falco)</h2>
        <table>
            <tr>
                <th>Priority</th>
                <th>Count</th>
            </tr>
            <tr><td>Critical</td><td>${report.runtimeSecurity.critical}</td></tr>
            <tr><td>Warning</td><td>${report.runtimeSecurity.warning}</td></tr>
            <tr><td>Notice</td><td>${report.runtimeSecurity.notice}</td></tr>
            <tr><td>Total Events</td><td>${report.runtimeSecurity.total}</td></tr>
        </table>
        ` : ''}

        <h2>📝 Report Details</h2>
        <p>Full JSON report available in reports directory.</p>
    </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Save report
   */
  saveReport(report, format = 'json') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (format === 'json') {
      const jsonPath = path.join(this.reportDir, `security-report-${timestamp}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
      console.log(`JSON report saved to: ${jsonPath}`);
      return jsonPath;
    } else if (format === 'html') {
      const html = this.generateHTMLReport(report);
      const htmlPath = path.join(this.reportDir, `security-report-${timestamp}.html`);
      fs.writeFileSync(htmlPath, html);
      console.log(`HTML report saved to: ${htmlPath}`);
      return htmlPath;
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const reporter = new SecurityReporter();
  
  const options = {
    trivyPath: process.env.TRIVY_RESULTS_PATH || './trivy-results.json',
    checkovPath: process.env.CHECKOV_RESULTS_PATH || './checkov-results.json',
    sastPath: process.env.SONAR_RESULTS_PATH || './sonarqube-results.json',
    falcoPath: process.env.FALCO_EVENTS_PATH || '/var/log/falco/events.log'
  };

  const report = reporter.generateReport(options);
  reporter.saveReport(report, 'json');
  reporter.saveReport(report, 'html');
  
  console.log('\n=== Security Report Summary ===');
  console.log(`Overall Risk Level: ${report.summary.overallRiskLevel}`);
  console.log(`Critical Issues: ${report.summary.criticalIssues}`);
  console.log(`High Issues: ${report.summary.highIssues}`);
  console.log(`Medium Issues: ${report.summary.mediumIssues}`);
  console.log(`Low Issues: ${report.summary.lowIssues}`);
  
  // Exit with error code if critical issues found
  process.exit(report.summary.criticalIssues > 0 ? 1 : 0);
}

export default SecurityReporter;
