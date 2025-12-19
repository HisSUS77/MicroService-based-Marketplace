# Terraform Compliance Tests
# These tests ensure infrastructure follows security best practices

Feature: Encryption and Security
  Scenario: Ensure all storage accounts have encryption enabled
    Given I have azurerm_storage_account defined
    Then it must contain encryption

  Scenario: Ensure Key Vault has purge protection enabled
    Given I have azurerm_key_vault defined
    Then it must contain purge_protection_enabled
    And its value must be true

  Scenario: Ensure PostgreSQL has SSL enforcement
    Given I have azurerm_postgresql_flexible_server defined
    Then it must contain ssl_enforcement_enabled
    And its value must be true

Feature: Network Security
  Scenario: Ensure AKS has network policy enabled
    Given I have azurerm_kubernetes_cluster defined
    Then it must contain network_profile
    And it must contain network_policy

  Scenario: Ensure resources are not publicly accessible
    Given I have any resource defined
    When it contains public_network_access_enabled
    Then its value must be false

Feature: Access Control
  Scenario: Ensure Key Vault uses RBAC
    Given I have azurerm_key_vault defined
    Then it must contain enable_rbac_authorization
    And its value must be true

  Scenario: Ensure AKS has RBAC enabled
    Given I have azurerm_kubernetes_cluster defined
    Then it must contain role_based_access_control_enabled
    And its value must be true

Feature: Monitoring and Logging
  Scenario: Ensure resources have diagnostic settings
    Given I have azurerm_kubernetes_cluster defined
    Then it must contain azure_monitor

  Scenario: Ensure Log Analytics workspace is configured
    Given I have azurerm_log_analytics_workspace defined
    Then it must contain retention_in_days
    And its value must be greater than or equal to 30

Feature: High Availability
  Scenario: Ensure PostgreSQL has high availability
    Given I have azurerm_postgresql_flexible_server defined
    Then it must contain high_availability
    And it must contain mode

  Scenario: Ensure backup retention is configured
    Given I have azurerm_postgresql_flexible_server defined
    Then it must contain backup_retention_days
    And its value must be greater than or equal to 7
