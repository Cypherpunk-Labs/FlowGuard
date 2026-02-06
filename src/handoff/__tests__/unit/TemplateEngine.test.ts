import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateEngine } from '../../TemplateEngine';
import { TemplateVariables } from '../../types';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine();
  });

  describe('section loops', () => {
    it('should render {{#specs}} loop correctly', () => {
      const template = `## Specifications
{{#specs}}
### {{title}}
{{content}}
{{/specs}}`;

      const variables: TemplateVariables = {
        epicTitle: 'Test Epic',
        epicId: '123',
        timestamp: '2024-01-01',
        author: 'test',
        specs: [
          { id: '1', title: 'Spec 1', content: 'Content for spec 1', status: 'draft' },
          { id: '2', title: 'Spec 2', content: 'Content for spec 2', status: 'approved' }
        ],
        tickets: [],
        codebaseContext: '',
        totalFiles: 0,
        totalLines: 0,
        languages: '',
        codebaseFiles: []
      };

      const result = engine.render(template, variables);
      
      expect(result).toContain('## Specifications');
      expect(result).toContain('### Spec 1');
      expect(result).toContain('Content for spec 1');
      expect(result).toContain('### Spec 2');
      expect(result).toContain('Content for spec 2');
    });

    it('should render {{#tickets}} loop correctly', () => {
      const template = `## Tasks
{{#tickets}}
**[{{priority}}] {{title}}**
{{content}}
Estimated Effort: {{estimatedEffort}}
{{/tickets}}`;

      const variables: TemplateVariables = {
        epicTitle: 'Test Epic',
        epicId: '123',
        timestamp: '2024-01-01',
        author: 'test',
        specs: [],
        tickets: [
          { 
            id: '1', 
            title: 'Ticket 1', 
            content: 'Implement feature A', 
            priority: 'high',
            estimatedEffort: '3 days',
            status: 'open'
          },
          { 
            id: '2', 
            title: 'Ticket 2', 
            content: 'Fix bug B', 
            priority: 'low',
            estimatedEffort: '1 day',
            status: 'open'
          }
        ],
        codebaseContext: '',
        totalFiles: 0,
        totalLines: 0,
        languages: '',
        codebaseFiles: []
      };

      const result = engine.render(template, variables);
      
      expect(result).toContain('## Tasks');
      expect(result).toContain('**[high] Ticket 1**');
      expect(result).toContain('Implement feature A');
      expect(result).toContain('Estimated Effort: 3 days');
      expect(result).toContain('**[low] Ticket 2**');
      expect(result).toContain('Fix bug B');
      expect(result).toContain('Estimated Effort: 1 day');
    });

    it('should handle empty arrays in section loops', () => {
      const template = `{{#specs}}
### {{title}}
{{/specs}}`;

      const variables: TemplateVariables = {
        epicTitle: 'Test Epic',
        epicId: '123',
        timestamp: '2024-01-01',
        author: 'test',
        specs: [],
        tickets: [],
        codebaseContext: '',
        totalFiles: 0,
        totalLines: 0,
        languages: '',
        codebaseFiles: []
      };

      const result = engine.render(template, variables);
      
      // Empty array should produce no output
      expect(result.trim()).toBe('');
    });

    it('should handle nested properties in loops', () => {
      const template = `{{#specs}}
Title: {{title}}, ID: {{id}}, Status: {{status}}
{{/specs}}`;

      const variables: TemplateVariables = {
        epicTitle: 'Test Epic',
        epicId: '123',
        timestamp: '2024-01-01',
        author: 'test',
        specs: [
          { id: 'spec-1', title: 'First Spec', content: '', status: 'draft' }
        ],
        tickets: [],
        codebaseContext: '',
        totalFiles: 0,
        totalLines: 0,
        languages: '',
        codebaseFiles: []
      };

      const result = engine.render(template, variables);
      
      expect(result).toContain('Title: First Spec');
      expect(result).toContain('ID: spec-1');
      expect(result).toContain('Status: draft');
    });
  });

  describe('conditional rendering', () => {
    it('should render {{#if codebaseContext}} when truthy', () => {
      const template = `## Context
{{#if codebaseContext}}
{{codebaseContext}}
{{/if}}`;

      const variables: TemplateVariables = {
        epicTitle: 'Test Epic',
        epicId: '123',
        timestamp: '2024-01-01',
        author: 'test',
        specs: [],
        tickets: [],
        codebaseContext: 'This is the codebase context',
        totalFiles: 0,
        totalLines: 0,
        languages: '',
        codebaseFiles: []
      };

      const result = engine.render(template, variables);
      
      expect(result).toContain('## Context');
      expect(result).toContain('This is the codebase context');
    });

    it('should not render {{#if codebaseContext}} when empty string', () => {
      const template = `## Context
{{#if codebaseContext}}
This should not appear
{{/if}}`;

      const variables: TemplateVariables = {
        epicTitle: 'Test Epic',
        epicId: '123',
        timestamp: '2024-01-01',
        author: 'test',
        specs: [],
        tickets: [],
        codebaseContext: '',
        totalFiles: 0,
        totalLines: 0,
        languages: '',
        codebaseFiles: []
      };

      const result = engine.render(template, variables);
      
      expect(result).toContain('## Context');
      expect(result).not.toContain('This should not appear');
    });

    it('should not render {{#if codebaseContext}} when undefined', () => {
      const template = `{{#if codebaseContext}}
Hidden content
{{/if}}`;

      const variables = {
        epicTitle: 'Test Epic',
        epicId: '123',
        timestamp: '2024-01-01',
        author: 'test',
        specs: [],
        tickets: [],
        // codebaseContext is undefined
        totalFiles: 0,
        totalLines: 0,
        languages: '',
        codebaseFiles: []
      } as unknown as TemplateVariables;

      const result = engine.render(template, variables);
      
      expect(result.trim()).toBe('');
    });

    it('should render conditional with boolean true', () => {
      const template = `{{#if isEnabled}}
Feature is enabled
{{/if}}`;

      const variables = {
        epicTitle: 'Test Epic',
        epicId: '123',
        timestamp: '2024-01-01',
        author: 'test',
        specs: [],
        tickets: [],
        isEnabled: true,
        codebaseContext: '',
        totalFiles: 0,
        totalLines: 0,
        languages: '',
        codebaseFiles: []
      } as unknown as TemplateVariables;

      const result = engine.render(template, variables);
      
      expect(result).toContain('Feature is enabled');
    });

    it('should not render conditional with boolean false', () => {
      const template = `{{#if isEnabled}}
Feature is enabled
{{/if}}`;

      const variables = {
        epicTitle: 'Test Epic',
        epicId: '123',
        timestamp: '2024-01-01',
        author: 'test',
        specs: [],
        tickets: [],
        isEnabled: false,
        codebaseContext: '',
        totalFiles: 0,
        totalLines: 0,
        languages: '',
        codebaseFiles: []
      } as unknown as TemplateVariables;

      const result = engine.render(template, variables);
      
      expect(result.trim()).toBe('');
    });
  });

  describe('variable substitution', () => {
    it('should substitute simple variables', () => {
      const template = `Title: {{epicTitle}}`;

      const variables: TemplateVariables = {
        epicTitle: 'My Epic',
        epicId: '123',
        timestamp: '2024-01-01',
        author: 'test',
        specs: [],
        tickets: [],
        codebaseContext: '',
        totalFiles: 0,
        totalLines: 0,
        languages: '',
        codebaseFiles: []
      };

      const result = engine.render(template, variables);
      
      expect(result).toBe('Title: My Epic');
    });

    it('should substitute multiple variables', () => {
      const template = `# {{epicTitle}}

Generated: {{timestamp}}
Author: {{author}}`;

      const variables: TemplateVariables = {
        epicTitle: 'My Epic',
        epicId: '123',
        timestamp: '2024-01-15',
        author: 'John Doe',
        specs: [],
        tickets: [],
        codebaseContext: '',
        totalFiles: 0,
        totalLines: 0,
        languages: '',
        codebaseFiles: []
      };

      const result = engine.render(template, variables);
      
      expect(result).toContain('# My Epic');
      expect(result).toContain('Generated: 2024-01-15');
      expect(result).toContain('Author: John Doe');
    });

    it('should leave unknown variables as empty strings', () => {
      const template = `Known: {{epicTitle}}, Unknown: {{unknownVar}}`;

      const variables: TemplateVariables = {
        epicTitle: 'My Epic',
        epicId: '123',
        timestamp: '2024-01-01',
        author: 'test',
        specs: [],
        tickets: [],
        codebaseContext: '',
        totalFiles: 0,
        totalLines: 0,
        languages: '',
        codebaseFiles: []
      };

      const result = engine.render(template, variables);
      
      expect(result).toBe('Known: My Epic, Unknown: ');
    });
  });

  describe('complex templates', () => {
    it('should render complete handoff template', () => {
      const template = `# Development Task - {{epicTitle}}

## Context
{{#specs}}
### Spec: {{title}}
{{content}}
{{/specs}}

## Tasks
{{#tickets}}
### {{title}} ({{priority}})
{{content}}
{{/tickets}}

{{#if codebaseContext}}
## Codebase Context
{{codebaseContext}}
{{/if}}

## Instructions
Implement the tasks above.`;

      const variables: TemplateVariables = {
        epicTitle: 'Authentication System',
        epicId: 'auth-123',
        timestamp: '2024-01-15T10:30:00Z',
        author: 'Alice',
        specs: [
          { 
            id: 'spec-1', 
            title: 'Login Flow', 
            content: 'Implement secure login with OAuth', 
            status: 'approved' 
          },
          { 
            id: 'spec-2', 
            title: 'Registration', 
            content: 'User registration with email verification', 
            status: 'draft' 
          }
        ],
        tickets: [
          { 
            id: 'ticket-1', 
            title: 'Setup OAuth Provider', 
            content: 'Configure Google and GitHub OAuth', 
            priority: 'high',
            estimatedEffort: '2 days',
            status: 'open'
          }
        ],
        codebaseContext: 'TypeScript project with Express backend',
        totalFiles: 42,
        totalLines: 3500,
        languages: 'TypeScript, JavaScript',
        codebaseFiles: [
          { path: 'src/index.ts', language: 'typescript', loc: 50 }
        ]
      };

      const result = engine.render(template, variables);
      
      expect(result).toContain('# Development Task - Authentication System');
      expect(result).toContain('### Spec: Login Flow');
      expect(result).toContain('Implement secure login with OAuth');
      expect(result).toContain('### Spec: Registration');
      expect(result).toContain('User registration with email verification');
      expect(result).toContain('### Setup OAuth Provider (high)');
      expect(result).toContain('Configure Google and GitHub OAuth');
      expect(result).toContain('## Codebase Context');
      expect(result).toContain('TypeScript project with Express backend');
      expect(result).toContain('Implement the tasks above.');
    });
  });

  describe('template validation', () => {
    it('should validate correct template', () => {
      const template = `{{#specs}}{{title}}{{/specs}}`;
      
      const result = engine.validateTemplate(template);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unclosed section tag', () => {
      const template = `{{#specs}}{{title}}`;
      
      const result = engine.validateTemplate(template);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Unclosed tag');
    });

    it('should detect unmatched closing tag', () => {
      const template = `{{title}}{{/specs}}`;
      
      const result = engine.validateTemplate(template);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Unmatched closing tag');
    });

    it('should detect mismatched section tags', () => {
      const template = `{{#specs}}{{title}}{{/tickets}}`;
      
      const result = engine.validateTemplate(template);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Expected {{/specs}}');
    });

    it('should validate conditional tags', () => {
      const template = `{{#if condition}}content{{/if}}`;
      
      const result = engine.validateTemplate(template);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unclosed conditional tag', () => {
      const template = `{{#if condition}}content`;
      
      const result = engine.validateTemplate(template);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Unclosed tag: {{#if');
    });
  });
});
