import { TemplateEngine } from '../src/handoff/TemplateEngine';
import { TicketTemplates } from '../src/planning/templates/TicketTemplates';
import { MermaidGenerator } from '../src/planning/diagrams/MermaidGenerator';
import { TemplateContribution } from '../src/plugins/types';

// Mock plugin contributions
const mockPluginTemplates: TemplateContribution[] = [
  {
    id: 'custom-feature-template',
    name: 'Custom Feature Template',
    type: 'ticket',
    template: '## {{title}}\n\n### Description\n{{description}}\n\n### Acceptance Criteria\n{{acceptanceCriteria}}',
    variables: [
      { name: 'title', description: 'Ticket title', required: true },
      { name: 'description', description: 'Feature description', required: true },
      { name: 'acceptanceCriteria', description: 'Acceptance criteria', required: true }
    ]
  },
  {
    id: 'custom-handoff-template',
    name: 'Custom Handoff Template',
    type: 'handoff',
    template: '# {{epicTitle}}\n\n## Tasks\n{{#tickets}}{{title}}{{/tickets}}',
    variables: [
      { name: 'epicTitle', description: 'Epic title', required: true },
      { name: 'tickets', description: 'Tickets to implement', required: true }
    ]
  }
];

const mockPluginDiagramTypes = [
  {
    id: 'custom-architecture',
    name: 'Custom Architecture Diagram',
    fileExtension: 'mmd',
    generate: async (context: any) => {
      return `graph TD\n  A[Custom Component] --> B[Another Component]`;
    }
  }
];

describe('Plugin Integration', () => {
  beforeEach(() => {
    // Clear any existing plugin contributions
    TemplateEngine.setPluginTemplates([]);
    TicketTemplates.setPluginTemplates([]);
    MermaidGenerator.setPluginDiagramTypes([]);
  });

  test('TemplateEngine plugin integration', () => {
    TemplateEngine.setPluginTemplates(mockPluginTemplates);
    
    const templates = TemplateEngine.getPluginTemplates();
    expect(templates).toHaveLength(2);
    expect(templates[0].id).toBe('custom-feature-template');
    
    const template = TemplateEngine.getPluginTemplate('custom-feature-template');
    expect(template).toBeDefined();
    expect(template?.name).toBe('Custom Feature Template');
  });

  test('TicketTemplates plugin integration', () => {
    TicketTemplates.setPluginTemplates(mockPluginTemplates);
    
    const templates = TicketTemplates.getPluginTemplates();
    expect(templates).toHaveLength(1); // Only ticket type templates
    expect(templates[0].id).toBe('custom-feature-template');
    
    const availableTypes = new TicketTemplates().getAvailableTypes();
    expect(availableTypes).toContain('custom-feature-template');
    
    const template = new TicketTemplates().getTemplate('custom-feature-template' as any);
    expect(template).toBeDefined();
    expect(template.pluginTemplate).toBeDefined();
  });

  test('MermaidGenerator plugin integration', () => {
    MermaidGenerator.setPluginDiagramTypes(mockPluginDiagramTypes);
    
    const diagramTypes = MermaidGenerator.getPluginDiagramTypes();
    expect(diagramTypes).toHaveLength(1);
    expect(diagramTypes[0].id).toBe('custom-architecture');
    
    const supportedTypes = MermaidGenerator.getSupportedDiagramTypes();
    expect(supportedTypes).toContain('custom-architecture');
  });
});