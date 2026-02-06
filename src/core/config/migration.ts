import * as vscode from 'vscode';
import { LLMProviderType } from './types';
import { secureStorage } from './SecureStorage';
import { configurationManager } from './ConfigurationManager';

interface MigrationResult {
  success: boolean;
  migratedItems: string[];
  errors: string[];
}

class ConfigurationMigration {
  private static instance: ConfigurationMigration | null = null;
  private migrationVersionKey = 'flowguard.migrationVersion';
  private currentMigrationVersion = 2;
  private globalState: vscode.Memento | null = null;

  private constructor() {}

  static getInstance(): ConfigurationMigration {
    if (!ConfigurationMigration.instance) {
      ConfigurationMigration.instance = new ConfigurationMigration();
    }
    return ConfigurationMigration.instance;
  }

  initialize(globalState: vscode.Memento): void {
    this.globalState = globalState;
  }

  async runMigrations(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedItems: [],
      errors: []
    };

    try {
      const currentVersion = this.getMigrationVersion();
      
      if (currentVersion < 2) {
        const v2Result = await this.migrateToVersion2();
        result.migratedItems.push(...v2Result.migratedItems);
        result.errors.push(...v2Result.errors);
      }

      if (result.errors.length > 0) {
        result.success = false;
      }

      this.setMigrationVersion(this.currentMigrationVersion);
    } catch (error) {
      result.success = false;
      result.errors.push(`Migration failed: ${error}`);
    }

    return result;
  }

  private getMigrationVersion(): number {
    if (!this.globalState) {
      return 1;
    }
    return this.globalState.get<number>(this.migrationVersionKey, 1);
  }

  private setMigrationVersion(version: number): void {
    if (!this.globalState) {
      return;
    }
    this.globalState.update(this.migrationVersionKey, version);
  }

  private async migrateToVersion2(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedItems: [],
      errors: []
    };

    try {
      await this.migrateLegacyApiKey(result);
      await this.migrateTemplatePaths(result);
      await this.migrateLogLevel(result);
    } catch (error) {
      result.success = false;
      result.errors.push(`Version 2 migration failed: ${error}`);
    }

    return result;
  }

  private async migrateLegacyApiKey(result: MigrationResult): Promise<void> {
    try {
      const legacyKey = await secureStorage.getApiKey('local' as LLMProviderType);
      if (!legacyKey) {
        const oldApiKey = await this.getOldApiKeyFromSecrets();
        if (oldApiKey) {
          const provider = this.detectProviderFromKey(oldApiKey);
          if (provider) {
            await secureStorage.storeApiKey(provider, oldApiKey);
            result.migratedItems.push('API key migrated to provider-specific storage');
          }
        }
      }
    } catch (error) {
      result.errors.push(`API key migration failed: ${error}`);
    }
  }

  private async getOldApiKeyFromSecrets(): Promise<string | undefined> {
    try {
      const { workspace } = vscode;
      const secrets = workspace.getConfiguration('flowguard.llm');
      return secrets.get<string>('apiKey');
    } catch {
      return undefined;
    }
  }

  private detectProviderFromKey(key: string): LLMProviderType | null {
    if (key.startsWith('sk-ant-api03-')) {
      return 'anthropic';
    }
    if (key.startsWith('sk-')) {
      return 'openai';
    }
    return null;
  }

  private async migrateTemplatePaths(result: MigrationResult): Promise<void> {
    try {
      const oldPath = this.getOldTemplatePath();
      if (oldPath) {
        await configurationManager.set('templates', 'customPath', oldPath);
        result.migratedItems.push('Template path configuration migrated');
      }
    } catch (error) {
      result.errors.push(`Template path migration failed: ${error}`);
    }
  }

  private getOldTemplatePath(): string | undefined {
    try {
      const { workspace } = vscode;
      const config = workspace.getConfiguration('flowguard');
      return config.get<string>('templatePath');
    } catch {
      return undefined;
    }
  }

  private async migrateLogLevel(result: MigrationResult): Promise<void> {
    try {
      const oldLevel = this.getOldLogLevel();
      if (oldLevel) {
        const newLevel = this.convertLogLevel(oldLevel);
        await configurationManager.set('general', 'logLevel', newLevel);
        result.migratedItems.push('Log level configuration migrated');
      }
    } catch (error) {
      result.errors.push(`Log level migration failed: ${error}`);
    }
  }

  private getOldLogLevel(): string | undefined {
    try {
      const { workspace } = vscode;
      const config = workspace.getConfiguration('flowguard');
      return config.get<string>('logLevel');
    } catch {
      return undefined;
    }
  }

  private convertLogLevel(oldLevel: string): 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' {
    const levelMap: Record<string, 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'> = {
      'verbose': 'DEBUG',
      'info': 'INFO',
      'warning': 'WARN',
      'error': 'ERROR'
    };
    return levelMap[oldLevel.toLowerCase()] || 'INFO';
  }

  async rollbackMigration(): Promise<void> {
    this.setMigrationVersion(1);
  }

  getMigrationStatus(): { currentVersion: number; latestVersion: number; needsMigration: boolean } {
    const current = this.getMigrationVersion();
    return {
      currentVersion: current,
      latestVersion: this.currentMigrationVersion,
      needsMigration: current < this.currentMigrationVersion
    };
  }
}

export const configurationMigration = ConfigurationMigration.getInstance();
