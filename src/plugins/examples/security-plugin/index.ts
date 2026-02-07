import { FlowGuardPlugin, PluginContext, VerificationRule } from '../../types';
import { HardcodedSecretsRule } from './rules/HardcodedSecretsRule';
import { SqlInjectionRule } from './rules/SqlInjectionRule';
import { XssVulnerabilityRule } from './rules/XssVulnerabilityRule';

/**
 * Security Verification Plugin for FlowGuard
 * Detects hardcoded secrets and security vulnerabilities
 */
export default class SecurityPlugin implements FlowGuardPlugin {
  id = 'flowguard.security';
  name = 'Security Verification Plugin';
  version = '1.0.0';
  description = 'Detects hardcoded secrets and security vulnerabilities';
  author = 'FlowGuard Team';

  private registeredRules: string[] = [];

  async activate(context: PluginContext): Promise<void> {
    context.logger.info('Activating Security Verification Plugin');

    // Register security rules
    const rules: VerificationRule[] = [
      new HardcodedSecretsRule(),
      new SqlInjectionRule(),
      new XssVulnerabilityRule()
    ];

    for (const rule of rules) {
      try {
        context.registerVerificationRule(rule);
        this.registeredRules.push(rule.id);
        context.logger.info(`Registered rule: ${rule.id}`);
      } catch (err) {
        context.logger.error(`Failed to register rule ${rule.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    context.logger.info(`Security Plugin activated with ${this.registeredRules.length} rules`);
  }

  async deactivate(): Promise<void> {
    // Rules are automatically cleaned up by the plugin manager
    this.registeredRules = [];
  }
}
