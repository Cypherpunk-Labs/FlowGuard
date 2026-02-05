export interface Spec {
  id: string;
  epicId: string;
  title: string;
  status: SpecStatus;
  createdAt: Date;
  updatedAt: Date;
  author: string;
  tags: string[];
  content: string;
}

export type SpecStatus = 'draft' | 'in_review' | 'approved' | 'archived';
