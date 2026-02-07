export interface Diagram {
  id: string;
  type: DiagramType;
  title: string;
  content: string;
}

export type DiagramType = 'sequence' | 'architecture' | 'flow' | 'class' | 'state';
