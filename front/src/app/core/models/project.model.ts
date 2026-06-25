export type ProjectStage = 'pending' | 'recording' | 'mixing' | 'mastering' | 'finalization' | 'delivered';

export interface HistoryEntry {
  _id: string;
  stage: ProjectStage;
  comment: string;
  updatedBy: any;
  createdAt: string;
}

export interface Project {
  _id: string;
  title: string;
  artist: any;
  engineer?: any;
  booking?: any;
  stage: ProjectStage;
  stageLabel?: string;
  progress: number;
  history: HistoryEntry[];
  description?: string;
  genre?: string;
  bpm?: number;
  key?: string;
  files: any[];
  isArchived: boolean;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}
