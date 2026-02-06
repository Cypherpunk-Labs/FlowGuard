import { describe, it, expect, beforeEach } from '@jest/globals';
import * as ts from 'typescript';
import { TypeScriptAnalyzer } from '../../../src/planning/codebase/TypeScriptAnalyzer';
import { FileSummary, CodeSymbol } from '../../../src/planning/codebase/types';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn()
  }
}));

describe('TypeScriptAnalyzer', () => {
  let analyzer: TypeScriptAnalyzer;

  beforeEach(() => {
    analyzer = new TypeScriptAnalyzer();
  });

  describe('analyzeFile', () => {
    it('should analyze a simple TypeScript file with class', async () => {
      const mockContent = `
/**
 * User class representing a system user
 */
export class User {
  private id: string;
  public email: string;

  constructor(id: string, email: string) {
    this.id = id;
    this.email = email;
  }

  public getId(): string {
    return this.id;
  }
}
`;
      const fs = require('fs');
      fs.promises.readFile.mockResolvedValue(mockContent);

      const result = await analyzer.analyzeFile('/test/user.ts');

      expect(result).toBeDefined();
      expect(result.path).toBe('/test/user.ts');
      expect(result.language).toBe('typescript');
      expect(result.symbols.length).toBeGreaterThan(0);

      const classSymbol = result.symbols.find(s => s.kind === 'class');
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.name).toBe('User');
    });

    it('should extract function declarations', async () => {
      const mockContent = `
export function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}

export async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return response.json();
}
`;
      const fs = require('fs');
      fs.promises.readFile.mockResolvedValue(mockContent);

      const result = await analyzer.analyzeFile('/test/functions.ts');

      expect(result.symbols.filter(s => s.kind === 'function').length).toBe(2);
    });

    it('should extract interface declarations', async () => {
      const mockContent = `
/**
 * Interface for API responses
 */
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}
`;
      const fs = require('fs');
      fs.promises.readFile.mockResolvedValue(mockContent);

      const result = await analyzer.analyzeFile('/test/interfaces.ts');

      const interfaceSymbol = result.symbols.find(s => s.kind === 'interface');
      expect(interfaceSymbol).toBeDefined();
      expect(interfaceSymbol?.name).toBe('ApiResponse');
    });

    it('should extract type aliases', async () => {
      const mockContent = `
type UserID = string;
type Email = string;
type UserRecord = {
  id: UserID;
  email: Email;
};
`;
      const fs = require('fs');
      fs.promises.readFile.mockResolvedValue(mockContent);

      const result = await analyzer.analyzeFile('/test/types.ts');

      expect(result.symbols.filter(s => s.kind === 'type').length).toBeGreaterThanOrEqual(2);
    });

    it('should extract enum declarations', async () => {
      const mockContent = `
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}
`;
      const fs = require('fs');
      fs.promises.readFile.mockResolvedValue(mockContent);

      const result = await analyzer.analyzeFile('/test/enums.ts');

      const enumSymbol = result.symbols.find(s => s.kind === 'enum');
      expect(enumSymbol).toBeDefined();
      expect(enumSymbol?.name).toBe('LogLevel');
    });

    it('should count lines of code', async () => {
      const mockContent = `line1
line2
line3
line4
line5`;

      const fs = require('fs');
      fs.promises.readFile.mockResolvedValue(mockContent);

      const result = await analyzer.analyzeFile('/test/lines.ts');

      expect(result.loc).toBe(5);
    });

    it('should handle .tsx files as typescriptreact', async () => {
      const mockContent = 'export const Component = () => <div>Test</div>;';
      const fs = require('fs');
      fs.promises.readFile.mockResolvedValue(mockContent);

      const result = await analyzer.analyzeFile('/test/component.tsx');

      expect(result.language).toBe('typescriptreact');
    });

    it('should extract import statements', async () => {
      const mockContent = `
import { useState } from 'react';
import type { User } from './types';
import * as utils from './utils';
import './styles.css';
`;
      const fs = require('fs');
      fs.promises.readFile.mockResolvedValue(mockContent);

      const result = await analyzer.analyzeFile('/test/imports.ts');

      expect(result.imports.length).toBeGreaterThan(0);
      expect(result.imports).toContain('react');
    });

    it('should extract export statements', async () => {
      const mockContent = `
export class MyClass {}
export function myFunction() {}
export { AnotherClass };
export { NamedExport } from './other';
`;
      const fs = require('fs');
      fs.promises.readFile.mockResolvedValue(mockContent);

      const result = await analyzer.analyzeFile('/test/exports.ts');

      expect(result.exports.length).toBeGreaterThan(0);
    });

    it('should handle file read errors gracefully', async () => {
      const fs = require('fs');
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));

      const result = await analyzer.analyzeFile('/test/nonexistent.ts');

      expect(result.path).toBe('/test/nonexistent.ts');
      expect(result.symbols.length).toBe(0);
    });
  });

  describe('symbol extraction', () => {
    it('should correctly identify visibility modifiers', async () => {
      const mockContent = `
export class VisibilityTest {
  public publicMethod() {}
  private privateMethod() {}
  protected protectedMethod() {}
}
`;
      const fs = require('fs');
      fs.promises.readFile.mockResolvedValue(mockContent);

      const result = await analyzer.analyzeFile('/test/visibility.ts');

      const publicMethod = result.symbols.find(s => s.name === 'publicMethod');
      const privateMethod = result.symbols.find(s => s.name === 'privateMethod');
      const protectedMethod = result.symbols.find(s => s.name === 'protectedMethod');

      expect(publicMethod?.visibility).toBe('public');
      expect(privateMethod?.visibility).toBe('private');
      expect(protectedMethod?.visibility).toBe('protected');
    });

    it('should extract JSDoc documentation', async () => {
      const mockContent = `
/**
 * This is a documented function
 * @param x - The input value
 * @returns The output value
 */
function documented(x: number): number {
  return x * 2;
}
`;
      const fs = require('fs');
      fs.promises.readFile.mockResolvedValue(mockContent);

      const result = await analyzer.analyzeFile('/test/docs.ts');

      const funcSymbol = result.symbols.find(s => s.name === 'documented');
      expect(funcSymbol?.documentation).toBeDefined();
      expect(funcSymbol?.documentation).toContain('This is a documented function');
    });
  });
});
