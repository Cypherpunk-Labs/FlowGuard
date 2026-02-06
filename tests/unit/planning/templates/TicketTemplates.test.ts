import { describe, it, expect, beforeEach } from '@jest/globals';
import { TicketTemplates, TemplateType } from '../../../src/planning/templates/TicketTemplates';

describe('TicketTemplates', () => {
  let templates: TicketTemplates;

  beforeEach(() => {
    templates = new TicketTemplates();
  });

  describe('getTemplate', () => {
    it('should return feature template', () => {
      const template = templates.getTemplate('feature');

      expect(template).toBeDefined();
      expect(template.name).toBe('Feature Implementation');
      expect(template.content).toContain('## Description');
      expect(template.content).toContain('## Acceptance Criteria');
    });

    it('should return bugfix template', () => {
      const template = templates.getTemplate('bugfix');

      expect(template).toBeDefined();
      expect(template.name).toBe('Bug Fix');
      expect(template.content).toContain('## Problem Description');
      expect(template.content).toContain('## Root Cause');
    });

    it('should return refactor template', () => {
      const template = templates.getTemplate('refactor');

      expect(template).toBeDefined();
      expect(template.name).toBe('Refactoring');
      expect(template.content).toContain('## Current Behavior');
      expect(template.content).toContain('## Target Behavior');
    });

    it('should return documentation template', () => {
      const template = templates.getTemplate('documentation');

      expect(template).toBeDefined();
      expect(template.name).toBe('Documentation');
      expect(template.content).toContain('## Overview');
    });

    it('should return test template', () => {
      const template = templates.getTemplate('test');

      expect(template).toBeDefined();
      expect(template.name).toBe('Test Implementation');
      expect(template.content).toContain('## Test Cases');
    });

    it('should return custom template when specified', () => {
      const customContent = '# Custom Template\n\nCustom content here.';
      templates.saveCustomTemplate('custom', customContent);

      const template = templates.getTemplate('custom');

      expect(template).toBeDefined();
      expect(template.content).toBe(customContent);
    });

    it('should throw error for unknown template type', () => {
      expect(() => templates.getTemplate('unknown' as TemplateType)).toThrow();
    });
  });

  describe('applyTemplate', () => {
    it('should substitute variables in template', () => {
      const template = templates.getTemplate('feature');
      const variables = {
        title: 'New Feature',
        description: 'Feature description',
        epicId: 'epic-123'
      };

      const applied = templates.applyTemplate(template, variables);

      expect(applied).toContain(variables.title);
      expect(applied).toContain(variables.description);
    });

    it('should handle missing variables', () => {
      const template = templates.getTemplate('feature');
      const applied = templates.applyTemplate(template, {});

      expect(applied).toBeDefined();
    });

    it('should preserve template structure', () => {
      const template = templates.getTemplate('bugfix');
      const applied = templates.applyTemplate(template, { title: 'Bug Fix' });

      expect(applied).toContain('## Problem Description');
      expect(applied).toContain('## Root Cause');
    });
  });

  describe('saveCustomTemplate', () => {
    it('should save custom template', () => {
      const content = '# Custom\n\nCustom content.';
      templates.saveCustomTemplate('my-template', content);

      const template = templates.getTemplate('my-template');

      expect(template.content).toBe(content);
    });

    it('should overwrite existing custom template', () => {
      templates.saveCustomTemplate('my-template', 'Original');
      templates.saveCustomTemplate('my-template', 'Updated');

      const template = templates.getTemplate('my-template');

      expect(template.content).toBe('Updated');
    });
  });

  describe('listTemplates', () => {
    it('should list all available templates', () => {
      const list = templates.listTemplates();

      expect(list).toContain('feature');
      expect(list).toContain('bugfix');
      expect(list).toContain('refactor');
      expect(list).toContain('documentation');
      expect(list).toContain('test');
    });

    it('should include custom templates', () => {
      templates.saveCustomTemplate('custom1', 'Content 1');
      templates.saveCustomTemplate('custom2', 'Content 2');

      const list = templates.listTemplates();

      expect(list).toContain('custom1');
      expect(list).toContain('custom2');
    });
  });

  describe('validateTemplate', () => {
    it('should validate built-in templates', () => {
      const featureTemplate = templates.getTemplate('feature');
      const result = templates.validateTemplate(featureTemplate);

      expect(result.valid).toBe(true);
    });

    it('should detect missing required sections', () => {
      const invalidTemplate = { name: 'Invalid', content: 'No sections' };
      const result = templates.validateTemplate(invalidTemplate);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should validate custom templates', () => {
      const customTemplate = { name: 'Custom', content: '## Overview\n## Details' };
      const result = templates.validateTemplate(customTemplate);

      expect(result.valid).toBe(true);
    });
  });

  describe('template types', () => {
    it('should have all expected template types', () => {
      const types: TemplateType[] = ['feature', 'bugfix', 'refactor', 'documentation', 'test'];

      for (const type of types) {
        expect(() => templates.getTemplate(type)).not.toThrow();
      }
    });
  });
});
