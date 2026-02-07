import { ValidationResult, LLMConfiguration, TemplateConfiguration, CodebaseConfiguration } from './types';

export function validateNumberRange(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
}

export function validatePositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function validateEnum<T extends string>(value: string, allowedValues: T[]): boolean {
  return typeof value === 'string' && allowedValues.includes(value as T);
}

export function validatePath(path: string, mustExist: boolean = true): boolean {
  if (typeof path !== 'string' || path.length === 0) {
    return false;
  }
  if (!mustExist) {
    return true;
  }
  try {
    const fs = require('fs');
    return fs.existsSync(path);
  } catch {
    return false;
  }
}

export function validateUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateStringArray(value: any): boolean {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(item => typeof item === 'string');
}

export function validateGlobPatterns(patterns: string[]): boolean {
  if (!validateStringArray(patterns)) {
    return false;
  }
  const validPatternRegex = /^(\*\*\/|\/?)([\w.-]+(\/[\w.-]+)*|\*|\?|\[.*\](\[\^?.*\])?)+$/;
  return patterns.every(pattern => validPatternRegex.test(pattern));
}

export function validateLLMConfig(config: LLMConfiguration): ValidationResult {
  const errors: string[] = [];

  if (config.maxTokens !== undefined && !validateNumberRange(config.maxTokens, 100, 128000)) {
    errors.push('maxTokens must be between 100 and 128000');
  }
  if (config.timeout !== undefined && !validateNumberRange(config.timeout, 5000, 300000)) {
    errors.push('timeout must be between 5000 and 300000 milliseconds');
  }
  if (config.retryAttempts !== undefined && !validateNumberRange(config.retryAttempts, 0, 10)) {
    errors.push('retryAttempts must be between 0 and 10');
  }
  if (config.temperature !== undefined && !validateNumberRange(config.temperature, 0, 2)) {
    errors.push('temperature must be between 0 and 2');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateTemplateConfig(config: TemplateConfiguration): ValidationResult {
  const errors: string[] = [];

  if (config.maxCodebaseFiles !== undefined && !validateNumberRange(config.maxCodebaseFiles, 10, 500)) {
    errors.push('maxCodebaseFiles must be between 10 and 500');
  }
  if (config.customPath && !validatePath(config.customPath, false)) {
    errors.push('customPath must be a valid path');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateCodebaseConfig(config: CodebaseConfiguration): ValidationResult {
  const errors: string[] = [];

  if (config.maxFilesToScan !== undefined && !validateNumberRange(config.maxFilesToScan, 100, 10000)) {
    errors.push('maxFilesToScan must be between 100 and 10000');
  }
  if (config.excludePatterns && !validateStringArray(config.excludePatterns)) {
    errors.push('excludePatterns must be an array of strings');
  }
  if (config.includePatterns && !validateGlobPatterns(config.includePatterns)) {
    errors.push('includePatterns must be valid glob patterns');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
