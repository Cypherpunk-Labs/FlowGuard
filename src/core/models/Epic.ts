export interface Epic {
  id: string;
  title: string;
  overview: string;
  phases: Phase[];
  technicalPlan: TechnicalPlan;
  diagrams: Diagram[];
  metadata: EpicMetadata;
  status: EpicStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface EpicMetadata {
  author: string;
  tags: string[];
  priority: Priority;
  targetDate?: Date;
  stakeholders?: string[];
}

export type EpicStatus = 'draft' | 'planning' | 'in_progress' | 'in_review' | 'completed' | 'archived';

export interface Phase {
  id: string;
  title: string;
  description: string;
  status: PhaseStatus;
  deliverables: Deliverable[];
  dependencies: string[];
  order: number;
}

export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface Deliverable {
  id: string;
  title: string;
  description: string;
  type: 'spec' | 'ticket' | 'documentation' | 'diagram';
  status: 'pending' | 'in_progress' | 'done';
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';
