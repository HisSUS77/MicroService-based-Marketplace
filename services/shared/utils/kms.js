/**
 * AWS KMS Integration
 * Alternative to Vault for AWS-based deployments
 */

import { KMSClient, DecryptCommand, EncryptCommand } from '@aws-sdk/client-kms';
import { logger } from './logger.js';

class KMSManager {
  constructor() {
    this.useKMS = process.env.USE_AWS_KMS === 'true';
    this.keyId = process.env.AWS_KMS_KEY_ID;
    this.region = process.env.AWS_REGION || 'us-east-1';
    
    if (this.useKMS) {
      this.client = new KMSClient({ region: this.region });
      logger.info('AWS KMS client initialized', { region: this.region });
    }
  }

  /**
   * Decrypt data using KMS
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @returns {Promise<string>} - Decrypted plaintext
   */
  async decrypt(encryptedData) {
    if (!this.useKMS) {
      return encryptedData;
    }

    try {
      const command = new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedData, 'base64'),
        KeyId: this.keyId,
      });

      const response = await this.client.send(command);
      const plaintext = Buffer.from(response.Plaintext).toString('utf8');
      
      logger.info('Successfully decrypted data with KMS');
      return plaintext;
    } catch (error) {
      logger.error('KMS decryption failed', {
        error: error.message,
      });
      throw new Error(`KMS decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt data using KMS
   * @param {string} plaintext - Data to encrypt
   * @returns {Promise<string>} - Base64 encoded encrypted data
   */
  async encrypt(plaintext) {
    if (!this.useKMS) {
      return plaintext;
    }

    try {
      const command = new EncryptCommand({
        KeyId: this.keyId,
        Plaintext: Buffer.from(plaintext, 'utf8'),
      });

      const response = await this.client.send(command);
      const encrypted = Buffer.from(response.CiphertextBlob).toString('base64');
      
      logger.info('Successfully encrypted data with KMS');
      return encrypted;
    } catch (error) {
      logger.error('KMS encryption failed', {
        error: error.message,
      });
      throw new Error(`KMS encryption failed: ${error.message}`);
    }
  }

  /**
   * Initialize secrets by decrypting KMS-encrypted environment variables
   * @param {object} encryptedSecrets - Object with potentially encrypted values
   * @returns {Promise<object>} - Decrypted secrets
   */
  async initializeSecrets(encryptedSecrets) {
    if (!this.useKMS) {
      logger.info('KMS disabled, using plain environment variables');
      return encryptedSecrets;
    }

    try {
      const secrets = {};
      
      for (const [key, value] of Object.entries(encryptedSecrets)) {
        // Check if value looks encrypted (starts with encrypted_ prefix or is base64)
        if (value && typeof value === 'string' && value.startsWith('encrypted_')) {
          const encryptedValue = value.substring(10); // Remove prefix
          secrets[key] = await this.decrypt(encryptedValue);
        } else {
          secrets[key] = value;
        }
      }

      logger.info('Initialized secrets from KMS', {
        secretsProcessed: Object.keys(secrets).length,
      });

      return secrets;
    } catch (error) {
      logger.error('Failed to initialize secrets from KMS', {
        error: error.message,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const kmsManager = new KMSManager();
export default kmsManager;
