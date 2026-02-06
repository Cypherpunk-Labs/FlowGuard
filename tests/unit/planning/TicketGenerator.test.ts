import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TicketGenerator, TicketGenerationInput } from '../../../src/planning/TicketGenerator';
import { ArtifactStorage } from '../../../src/core/storage/ArtifactStorage';
import { ReferenceResolver } from '../../../src/core/references/ReferenceResolver';
import { Spec } from '../../../src/core/models/Spec';
import { Ticket } from '../../../src/core/models/Ticket';
import { createMockLLMProvider } from '../../utils/mocks';
import { createMockStorage } from '../../utils/mocks';
import { createMockReferenceResolver } from '../../utils/mocks';
import { v4 as uuidv4 } from 'uuid';

describe('TicketGenerator', () => {
  let generator: TicketGenerator;
  let mockLLMProvider: ReturnType<typeof createMockLLMProvider>;
  let mockStorage: Partial<ArtifactStorage>;
  let mockResolver: Partial<ReferenceResolver>;

  beforeEach(() => {
    mockLLMProvider = createMockLLMProvider();
    mockStorage = createMockStorage();
    mockResolver = createMockReferenceResolver();

    const testSpec: Spec = {
      id: uuidv4(),
      epicId: uuidv4(),
      title: 'Test Spec',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      author: 'Test',
      tags: [],
      content: '# Test Spec\n\n## Functional Requirements\n1. Requirement 1\n2. Requirement 2\n\n## Technical Plan\n### Files to Change\n- `src/test.ts`\n\n## Testing Strategy\nUnit tests for all new code.'
    };

    (mockStorage.loadSpec as jest.Mock).mockResolvedValue(testSpec);
    (mockStorage.saveTicket as jest.Mock).mockResolvedValue(undefined);
    (mockStorage.listTickets as jest.Mock).mockResolvedValue([]);

    generator = new TicketGenerator(
      mockLLMProvider,
      mockStorage as ArtifactStorage,
      mockResolver as ReferenceResolver
    );
  });

  describe('generateTickets', () => {
    it('should generate tickets with required structure', async () => {
      const input: TicketGenerationInput = {
        epicId: uuidv4(),
        specId: uuidv4()
      };

      const tickets = await generator.generateTickets(input);

      expect(tickets.length).toBeGreaterThan(0);
      tickets.forEach(ticket => {
        expect(ticket.id).toBeDefined();
        expect(ticket.title).toBeDefined();
        expect(ticket.content).toBeDefined();
        expect(ticket.status).toBeDefined();
        expect(ticket.priority).toBeDefined();
      });
    });

    it('should link tickets to spec via specId', async () => {
      const input: TicketGenerationInput = {
        epicId: uuidv4(),
        specId: uuidv4()
      };

      const tickets = await generator.generateTickets(input);

      tickets.forEach(ticket => {
        expect(ticket.specId).toBe(input.specId);
      });
    });

    it('should set epicId on all tickets', async () => {
      const epicId = uuidv4();
      const input: TicketGenerationInput = {
        epicId,
        specId: uuidv4()
      };

      const tickets = await generator.generateTickets(input);

      tickets.forEach(ticket => {
        expect(ticket.epicId).toBe(epicId);
      });
    });

    it('should respect maxTickets limit', async () => {
      const input: TicketGenerationInput = {
        epicId: uuidv4(),
        specId: uuidv4(),
        maxTickets: 2
      };

      const tickets = await generator.generateTickets(input);

      expect(tickets.length).toBeLessThanOrEqual(2);
    });

    it('should save tickets to storage', async () => {
      const input: TicketGenerationInput = {
        epicId: uuidv4(),
        specId: uuidv4()
      };

      await generator.generateTickets(input);

      expect(mockStorage.saveTicket).toHaveBeenCalled();
    });

    it('should handle missing reference resolver', async () => {
      const generatorNoResolver = new TicketGenerator(
        mockLLMProvider,
        mockStorage as ArtifactStorage
      );

      const input: TicketGenerationInput = {
        epicId: uuidv4(),
        specId: uuidv4()
      };

      const tickets = await generatorNoResolver.generateTickets(input);

      expect(tickets.length).toBeGreaterThan(0);
    });

    it('should set reference resolver when provided', async () => {
      const resolver = createMockReferenceResolver();
      const generatorWithResolver = new TicketGenerator(
        mockLLMProvider,
        mockStorage as ArtifactStorage,
        resolver as ReferenceResolver
      );

      expect(generatorWithResolver).toBeDefined();
    });
  });

  describe('ticket structure', () => {
    it('should generate tickets with content containing markdown sections', async () => {
      const input: TicketGenerationInput = {
        epicId: uuidv4(),
        specId: uuidv4()
      };

      const tickets = await generator.generateTickets(input);

      tickets.forEach(ticket => {
        expect(ticket.content).toContain('#');
      });
    });

    it('should generate tickets with valid status values', async () => {
      const input: TicketGenerationInput = {
        epicId: uuidv4(),
        specId: uuidv4()
      };

      const tickets = await generator.generateTickets(input);

      const validStatuses = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];
      tickets.forEach(ticket => {
        expect(validStatuses).toContain(ticket.status);
      });
    });

    it('should generate tickets with valid priority values', async () => {
      const input: TicketGenerationInput = {
        epicId: uuidv4(),
        specId: uuidv4()
      };

      const tickets = await generator.generateTickets(input);

      const validPriorities = ['low', 'medium', 'high', 'critical'];
      tickets.forEach(ticket => {
        expect(validPriorities).toContain(ticket.priority);
      });
    });
  });

  describe('priority distribution', () => {
    it('should handle balanced priority distribution', async () => {
      const input: TicketGenerationInput = {
        epicId: uuidv4(),
        specId: uuidv4(),
        priorityDistribution: 'balanced'
      };

      const tickets = await generator.generateTickets(input);

      expect(tickets.length).toBeGreaterThan(0);
    });

    it('should handle critical-first priority distribution', async () => {
      const input: TicketGenerationInput = {
        epicId: uuidv4(),
        specId: uuidv4(),
        priorityDistribution: 'critical-first'
      };

      const tickets = await generator.generateTickets(input);

      expect(tickets.length).toBeGreaterThan(0);
    });
  });
});
