import { describe, it, expect, beforeEach } from '@jest/globals';
import { MermaidGenerator, Component, Relationship, Interaction, ClassInfo } from '@/planning/diagrams/MermaidGenerator';

describe('MermaidGenerator', () => {
  let generator: MermaidGenerator;

  beforeEach(() => {
    generator = new MermaidGenerator();
  });

  describe('generateArchitectureDiagram', () => {
    it('should generate valid Mermaid graph', () => {
      const components: Component[] = [
        { id: 'api', label: 'API Server', type: 'backend' },
        { id: 'db', label: 'Database', type: 'database' },
        { id: 'frontend', label: 'Frontend', type: 'frontend' }
      ];

      const relationships: Relationship[] = [
        { from: 'frontend', to: 'api', type: 'sync', label: 'REST' },
        { from: 'api', to: 'db', type: 'sync', label: 'SQL' }
      ];

      const diagram = generator.generateArchitectureDiagram(components, relationships);

      expect(diagram).toContain('graph TD');
      expect(diagram).toContain('api');
      expect(diagram).toContain('db');
      expect(diagram).toContain('frontend');
    });

    it('should handle empty components', () => {
      const diagram = generator.generateArchitectureDiagram([], []);

      expect(diagram).toContain('graph TD');
      expect(diagram.length).toBeGreaterThan(0);
    });

    it('should include relationship labels', () => {
      const components: Component[] = [
        { id: 'a', label: 'A', type: 'service' },
        { id: 'b', label: 'B', type: 'database' }
      ];

      const relationships: Relationship[] = [
        { from: 'a', to: 'b', type: 'sync', label: 'Queries' }
      ];

      const diagram = generator.generateArchitectureDiagram(components, relationships);

      expect(diagram).toContain('Queries');
    });
  });

  describe('generateSequenceDiagram', () => {
    it('should generate valid sequence diagram', () => {
      const interactions: Interaction[] = [
        { from: 'User', to: 'Browser', message: 'Click button', order: 1, type: 'request' },
        { from: 'Browser', to: 'Server', message: 'API call', order: 2, type: 'request' },
        { from: 'Server', to: 'Database', message: 'Query', order: 3, type: 'request' }
      ];

      const diagram = generator.generateSequenceDiagram(interactions);

      expect(diagram).toContain('sequenceDiagram');
      expect(diagram).toContain('User');
      expect(diagram).toContain('Browser');
    });

    it('should include all participants', () => {
      const interactions: Interaction[] = [
        { from: 'Client', to: 'Server', message: 'Request', order: 1 },
        { from: 'Server', to: 'DB', message: 'Query', order: 2 }
      ];

      const diagram = generator.generateSequenceDiagram(interactions);

      expect(diagram).toContain('Client');
      expect(diagram).toContain('Server');
      expect(diagram).toContain('DB');
    });
  });

  describe('generateClassDiagram', () => {
    it('should generate valid class diagram', () => {
      const classes: ClassInfo[] = [
        {
          name: 'User',
          properties: [
            { name: 'id', type: 'string', visibility: 'private' },
            { name: 'email', type: 'string', visibility: 'public' }
          ],
          methods: [
            { name: 'getId', params: [], returnType: 'string', visibility: 'public' }
          ]
        }
      ];

      const diagram = generator.generateClassDiagram(classes);

      expect(diagram).toContain('classDiagram');
      expect(diagram).toContain('User');
      expect(diagram).toMatch(/\+ getId\(\)/);
    });

    it('should show class relationships', () => {
      const classes: ClassInfo[] = [
        {
          name: 'User',
          properties: [],
          methods: [],
          extends: 'BaseModel'
        },
        {
          name: 'BaseModel',
          properties: [],
          methods: []
        }
      ];

      const diagram = generator.generateClassDiagram(classes);

      expect(diagram).toContain('<|--');
    });
  });

  describe('diagram validation', () => {
    it('should generate syntactically valid Mermaid', () => {
      const diagram = generator.generateArchitectureDiagram(
        [{ id: 'test', label: 'Test', type: 'service' }],
        []
      );

      expect(diagram.length).toBeGreaterThan(0);
      expect(diagram).toContain('graph TD');
    });

    it('should escape special characters in labels', () => {
      const components: Component[] = [
        { id: 'test', label: 'Test [Special]', type: 'module' }
      ];

      const diagram = generator.generateArchitectureDiagram(components, []);

      expect(diagram).toContain('test');
    });
  });
});
