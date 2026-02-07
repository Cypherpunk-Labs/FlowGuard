import { LLMProvider, LLMMessage } from '../llm/types';

export interface ClarificationContext {
  goal: string;
  clarifications: Array<{ question: string; answer: string }>;
  extractedRequirements: string[];
}

interface ClarificationResponse {
  questions: string[];
}

export class ClarificationEngine {
  private provider: LLMProvider;

  constructor(provider: LLMProvider) {
    this.provider = provider;
  }

  async analyzeGoal(userGoal: string): Promise<string[]> {
    const systemPrompt: LLMMessage = {
      role: 'system',
      content: `You are a technical analyst helping to clarify software development requirements. 
Generate 2-3 targeted questions to understand the user's goal better. 
Focus on: scope, technical constraints, success criteria, and integration points.
Respond with a JSON object containing a "questions" array.`,
    };

    const userPrompt: LLMMessage = {
      role: 'user',
      content: `Analyze this development goal and generate clarifying questions: ${userGoal}`,
    };

    try {
      const response = await this.provider.generateStructured<ClarificationResponse>(
        [systemPrompt, userPrompt],
        { questions: { type: 'array', items: { type: 'string' } } }
      );

      if (!response.questions || !Array.isArray(response.questions)) {
        return this.getFallbackQuestions();
      }

      const validQuestions = response.questions.filter(q => 
        typeof q === 'string' && q.trim().length > 10
      );

      if (validQuestions.length === 0) {
        return this.getFallbackQuestions();
      }

      return validQuestions.slice(0, 3);
    } catch (error) {
      console.error('Error generating clarification questions:', error);
      return this.getFallbackQuestions();
    }
  }

  parseResponses(questions: string[], responses: string[]): ClarificationContext {
    const clarifications = questions.map((question, index) => ({
      question,
      answer: responses[index] || '',
    }));

    const extractedRequirements = this.extractRequirements(clarifications);

    return {
      goal: '',
      clarifications,
      extractedRequirements,
    };
  }

  parseResponsesWithGoal(goal: string, questions: string[], responses: string[]): ClarificationContext {
    const clarifications = questions.map((question, index) => ({
      question,
      answer: responses[index] || '',
    }));

    const extractedRequirements = this.extractRequirements(clarifications);

    return {
      goal,
      clarifications,
      extractedRequirements,
    };
  }

  private extractRequirements(clarifications: Array<{ question: string; answer: string }>): string[] {
    const requirements: string[] = [];
    
    for (const { answer } of clarifications) {
      if (answer.trim()) {
        const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
        requirements.push(...sentences.map(s => s.trim()));
      }
    }
    
    return requirements;
  }

  private getFallbackQuestions(): string[] {
    return [
      'What is the scope of this feature or change?',
      'Are there any specific technical constraints or requirements to consider?',
      'How will you measure the success of this implementation?',
    ];
  }
}
