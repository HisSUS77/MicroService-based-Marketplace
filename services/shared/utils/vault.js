/**
 * HashiCorp Vault Integration
 * Centralized secrets management for production environments
 */

import axios from 'axios';
import { logger } from './logger.js';

class VaultClient {
  constructor() {
    this.vaultAddr = process.env.VAULT_ADDR || 'http://localhost:8200';
    this.vaultToken = process.env.VAULT_TOKEN;
    this.vaultNamespace = process.env.VAULT_NAMESPACE || 'marketplace';
    this.mountPath = process.env.VAULT_MOUNT_PATH || 'secret';
    this.useVault = process.env.USE_VAULT === 'true';
    
    if (this.useVault && !this.vaultToken) {
      logger.warn('Vault enabled but VAULT_TOKEN not set');
    }
  }

  /**
   * Get secret from Vault
   * @param {string} path - Secret path (e.g., 'database/credentials')
   * @returns {Promise<object>} - Secret data
   */
  async getSecret(path) {
    if (!this.useVault) {
      logger.debug('Vault disabled, skipping secret fetch');
      return null;
    }

    try {
      const url = `${this.vaultAddr}/v1/${this.mountPath}/data/${this.vaultNamespace}/${path}`;
      
      const response = await axios.get(url, {
        headers: {
          'X-Vault-Token': this.vaultToken,
          'X-Vault-Namespace': this.vaultNamespace,
        },
        timeout: 5000,
      });

      logger.info('Successfully retrieved secret from Vault', { path });
      return response.data.data.data;
    } catch (error) {
      logger.error('Failed to retrieve secret from Vault', {
        path,
        error: error.message,
      });
      throw new Error(`Vault secret retrieval failed: ${error.message}`);
    }
  }

  /**
   * Write secret to Vault
   * @param {string} path - Secret path
   * @param {object} data - Secret data
   */
  async writeSecret(path, data) {
    if (!this.useVault) {
      logger.debug('Vault disabled, skipping secret write');
      return;
    }

    try {
      const url = `${this.vaultAddr}/v1/${this.mountPath}/data/${this.vaultNamespace}/${path}`;
      
      await axios.post(
        url,
        { data },
        {
          headers: {
            'X-Vault-Token': this.vaultToken,
            'X-Vault-Namespace': this.vaultNamespace,
          },
          timeout: 5000,
        }
      );

      logger.info('Successfully wrote secret to Vault', { path });
    } catch (error) {
      logger.error('Failed to write secret to Vault', {
        path,
        error: error.message,
      });
      throw new Error(`Vault secret write failed: ${error.message}`);
    }
  }

  /**
   * Delete secret from Vault
   * @param {string} path - Secret path
   */
  async deleteSecret(path) {
    if (!this.useVault) {
      logger.debug('Vault disabled, skipping secret delete');
      return;
    }

    try {
      const url = `${this.vaultAddr}/v1/${this.mountPath}/data/${this.vaultNamespace}/${path}`;
      
      await axios.delete(url, {
        headers: {
          'X-Vault-Token': this.vaultToken,
          'X-Vault-Namespace': this.vaultNamespace,
        },
        timeout: 5000,
      });

      logger.info('Successfully deleted secret from Vault', { path });
    } catch (error) {
      logger.error('Failed to delete secret from Vault', {
        path,
        error: error.message,
      });
      throw new Error(`Vault secret deletion failed: ${error.message}`);
    }
  }

  /**
   * Renew Vault token
   */
  async renewToken() {
    if (!this.useVault) {
      return;
    }

    try {
      const url = `${this.vaultAddr}/v1/auth/token/renew-self`;
      
      await axios.post(
        url,
        {},
        {
          headers: {
            'X-Vault-Token': this.vaultToken,
            'X-Vault-Namespace': this.vaultNamespace,
          },
          timeout: 5000,
        }
      );

      logger.info('Successfully renewed Vault token');
    } catch (error) {
      logger.error('Failed to renew Vault token', {
        error: error.message,
      });
      throw new Error(`Vault token renewal failed: ${error.message}`);
    }
  }

  /**
   * Initialize secrets from Vault or fallback to environment
   * @param {object} defaultSecrets - Default secrets from environment
   * @returns {Promise<object>} - Merged secrets
   */
  async initializeSecrets(defaultSecrets) {
    if (!this.useVault) {
      logger.info('Using environment variables for secrets');
      return defaultSecrets;
    }

    try {
      const secrets = {};
      
      // Fetch database credentials
      if (defaultSecrets.DB_PASSWORD) {
        const dbSecrets = await this.getSecret('database/credentials');
        if (dbSecrets) {
          secrets.DB_PASSWORD = dbSecrets.password;
          secrets.DB_USER = dbSecrets.username || defaultSecrets.DB_USER;
        }
      }

      // Fetch JWT secret
      if (defaultSecrets.JWT_SECRET) {
        const jwtSecrets = await this.getSecret('jwt/key');
        if (jwtSecrets) {
          secrets.JWT_SECRET = jwtSecrets.secret;
        }
      }

      // Fetch encryption key
      if (defaultSecrets.ENCRYPTION_KEY) {
        const encryptionSecrets = await this.getSecret('encryption/key');
        if (encryptionSecrets) {
          secrets.ENCRYPTION_KEY = encryptionSecrets.key;
        }
      }

      logger.info('Initialized secrets from Vault', {
        secretsLoaded: Object.keys(secrets).length,
      });

      // Merge with defaults (Vault takes precedence)
      return { ...defaultSecrets, ...secrets };
    } catch (error) {
      logger.error('Failed to initialize secrets from Vault, falling back to environment', {
        error: error.message,
      });
      return defaultSecrets;
    }
  }
}

// Export singleton instance
export const vaultClient = new VaultClient();

// Auto-renew token every 12 hours
if (vaultClient.useVault) {
  setInterval(() => {
    vaultClient.renewToken().catch((err) => {
      logger.error('Token renewal failed', { error: err.message });
    });
  }, 12 * 60 * 60 * 1000);
}

export default vaultClient;
