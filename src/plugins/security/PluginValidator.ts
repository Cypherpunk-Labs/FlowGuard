import { PluginManifest } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates plugin manifests for security and correctness
 */
export class PluginValidator {
  /**
   * Validate a plugin manifest
   */
  validateManifest(manifest: unknown): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!manifest || typeof manifest !== 'object') {
      result.valid = false;
      result.errors.push('Manifest must be an object');
      return result;
    }

    const m = manifest as Record<string, unknown>;

    // Required fields
    const requiredFields = ['id', 'name', 'version', 'description', 'main'];
    for (const field of requiredFields) {
      if (!(field in m)) {
        result.valid = false;
        result.errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate ID format
    if (m.id && typeof m.id === 'string') {
      const idRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
      if (!idRegex.test(m.id)) {
        result.valid = false;
        result.errors.push('Invalid plugin ID format. Must start with alphanumeric and contain only alphanumeric characters, dots, hyphens, and underscores');
      }
    }

    // Validate version format (semantic versioning)
    if (m.version && typeof m.version === 'string') {
      const versionRegex = /^\d+\.\d+\.\d+/;
      if (!versionRegex.test(m.version)) {
        result.valid = false;
        result.errors.push('Invalid version format. Expected: x.x.x');
      }
    }

    // Validate main entry point
    if (m.main && typeof m.main === 'string') {
      if (!m.main.endsWith('.js') && !m.main.endsWith('.ts')) {
        result.warnings.push('Main entry point should be a .js or .ts file');
      }
    }

    // Validate contributes section
    if (m.contributes && typeof m.contributes === 'object') {
      const c = m.contributes as Record<string, unknown>;

      // Validate verificationRules
      if (c.verificationRules && Array.isArray(c.verificationRules)) {
        for (const rule of c.verificationRules) {
          if (typeof rule !== 'string') {
            result.valid = false;
            result.errors.push('verificationRules must contain strings');
            break;
          }
        }
      }

      // Validate other contribution types similarly
      if (c.agentIntegrations && Array.isArray(c.agentIntegrations)) {
        for (const integration of c.agentIntegrations) {
          if (typeof integration !== 'string') {
            result.valid = false;
            result.errors.push('agentIntegrations must contain strings');
            break;
          }
        }
      }
    }

    // Validate engines
    if (m.engines && typeof m.engines === 'object') {
      const e = m.engines as Record<string, unknown>;
      if (e.flowguard && typeof e.flowguard === 'string') {
        const flowguardVersion = e.flowguard;
        if (!flowguardVersion.match(/^[~^]?\d+\.\d+\.\d+/)) {
          result.warnings.push('engines.flowguard should be a valid semantic version');
        }
      }
    }

    // Security checks
    this.performSecurityChecks(m, result);

    return result;
  }

  /**
   * Perform security-related validations
   */
  private performSecurityChecks(manifest: Record<string, unknown>, result: ValidationResult): void {
    // Check for suspicious patterns in ID
    if (manifest.id && typeof manifest.id === 'string') {
      const suspiciousPatterns = ['../', '..\\', '%', '$', '`', '|'];
      for (const pattern of suspiciousPatterns) {
        if (manifest.id.includes(pattern)) {
          result.valid = false;
          result.errors.push(`Plugin ID contains suspicious characters: ${pattern}`);
        }
      }
    }

    // Check for suspicious patterns in main entry point
    if (manifest.main && typeof manifest.main === 'string') {
      const suspiciousPatterns = ['../', '..\\', 'http://', 'https://'];
      for (const pattern of suspiciousPatterns) {
        if (manifest.main.includes(pattern)) {
          result.valid = false;
          result.errors.push(`Main entry point contains suspicious pattern: ${pattern}`);
        }
      }
    }

    // Warn about dependencies (future security concern)
    if (manifest.dependencies && typeof manifest.dependencies === 'object') {
      result.warnings.push('Plugin declares npm dependencies. Ensure these are from trusted sources.');
    }
  }

  /**
   * Check FlowGuard version compatibility
   */
  checkVersionCompatibility(manifest: PluginManifest, currentVersion: string): boolean {
    if (!manifest.engines?.flowguard) {
      return true; // No version requirement specified
    }

    const requiredVersion = manifest.engines.flowguard;

    // Simple major version check for ^ and ~ prefixes
    if (requiredVersion.startsWith('^') || requiredVersion.startsWith('~')) {
      const requiredMajor = parseInt(requiredVersion.replace(/[^0-9]/g, '').substring(0, 1) || '0');
      const currentMajor = parseInt(currentVersion.split('.')[0] || '0');
      return currentMajor >= requiredMajor;
    }

    // Exact version match
    return requiredVersion === currentVersion;
  }

  /**
   * Validate plugin code for security issues
   * This is a basic check - more sophisticated analysis would require AST parsing
   */
  validatePluginCode(code: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, message: 'Use of eval() detected - potential security risk' },
      { pattern: /new\s+Function\s*\(/, message: 'Dynamic function creation detected - potential security risk' },
      { pattern: /child_process/, message: 'Use of child_process detected - potential security risk' },
      { pattern: /fs\.unlinkSync\s*\(\s*['"]\//, message: 'Potential dangerous file deletion detected' },
      { pattern: /process\.env/, message: 'Access to environment variables detected' },
      { pattern: /require\s*\(\s*['"]https?:/, message: 'Remote module loading detected' },
    ];

    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(code)) {
        result.warnings.push(message);
      }
    }

    // Check for suspicious network activity
    const networkPatterns = [
      { pattern: /fetch\s*\(\s*['"]https?:/, message: 'Network fetch detected' },
      { pattern: /axios\s*\.\s*(get|post|put|delete)/, message: 'HTTP request detected' },
      { pattern: /http\s*\.\s*(get|request)/, message: 'HTTP request detected' },
    ];

    for (const { pattern, message } of networkPatterns) {
      if (pattern.test(code)) {
        result.warnings.push(`${message} - ensure this is expected behavior`);
      }
    }

    return result;
  }
}

// Export singleton instance
export const pluginValidator = new PluginValidator();
