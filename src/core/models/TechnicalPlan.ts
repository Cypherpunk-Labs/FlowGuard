export interface TechnicalPlan {
  files: FileChange[];
  dependencies: Dependency[];
  edgeCases: EdgeCase[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
  testingStrategy: TestingStrategy;
}

export interface FileChange {
  path: string;
  operation: 'create' | 'modify' | 'delete';
  description: string;
  content?: string;
}

export interface Dependency {
  type: 'internal' | 'external' | 'system';
  name: string;
  version?: string;
  purpose: string;
}

export interface EdgeCase {
  description: string;
  handling: string;
  severity: 'low' | 'medium' | 'high';
}

export interface NonFunctionalRequirement {
  category: 'performance' | 'security' | 'reliability' | 'usability';
  requirement: string;
  criteria: string;
}

export interface TestingStrategy {
  unitTests: string;
  integrationTests: string;
  e2eTests: string;
}
