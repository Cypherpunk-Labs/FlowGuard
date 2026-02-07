export interface Ticket {
  id: string;
  epicId: string;
  specId: string;
  title: string;
  status: TicketStatus;
  priority: Priority;
  assignee?: string;
  estimatedEffort?: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  content: string;
}

export type TicketStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';

export type Priority = 'low' | 'medium' | 'high' | 'critical';
