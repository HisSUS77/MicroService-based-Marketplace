/**
 * Unified Secrets Manager
 * Abstracts Vault and KMS to provide consistent secret management
 */

import { vaultClient } from './vault.js';
import { kmsManager } from './kms.js';
import { logger } from './logger.js';

class SecretsManager {
  constructor() {
    this.provider = this.detectProvider();
    logger.info(`Secrets manager initialized with provider: ${this.provider}`);
  }

  /**
   * Detect which secrets provider to use
   */
  detectProvider() {
    if (process.env.USE_VAULT === 'true') {
      return 'vault';
    } else if (process.env.USE_AWS_KMS === 'true') {
      return 'kms';
    } else if (process.env.USE_AZURE_KEYVAULT === 'true') {
      return 'azure';
    }
    return 'env';
  }

  /**
   * Load all application secrets
   * @returns {Promise<object>} - Application secrets
   */
  async loadSecrets() {
    const defaultSecrets = {
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    };

    try {
      switch (this.provider) {
        case 'vault':
          return await vaultClient.initializeSecrets(defaultSecrets);
        
        case 'kms':
          return await kmsManager.initializeSecrets(defaultSecrets);
        
        case 'env':
        default:
          logger.info('Using environment variables for secrets');
          return defaultSecrets;
      }
    } catch (error) {
      logger.error('Failed to load secrets, falling back to environment', {
        provider: this.provider,
        error: error.message,
      });
      return defaultSecrets;
    }
  }

  /**
   * Get a specific secret
   * @param {string} key - Secret key
   * @returns {Promise<string>} - Secret value
   */
  async getSecret(key) {
    const secrets = await this.loadSecrets();
    return secrets[key];
  }

  /**
   * Validate that all required secrets are present
   * @param {string[]} requiredKeys - List of required secret keys
   * @throws {Error} If any required secrets are missing
   */
  async validateSecrets(requiredKeys) {
    const secrets = await this.loadSecrets();
    const missing = [];

    for (const key of requiredKeys) {
      if (!secrets[key]) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      const error = `Missing required secrets: ${missing.join(', ')}`;
      logger.error(error);
      throw new Error(error);
    }

    logger.info('All required secrets validated successfully');
    return true;
  }
}

// Export singleton
export const secretsManager = new SecretsManager();
export default secretsManager;
