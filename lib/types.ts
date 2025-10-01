export interface ProjectItem {
  id: number;
  header: string;
  type: string;
  status: 'Done' | 'In Process' | 'Assign reviewer';
  target: string;
  limit: string;
  reviewer: string;
}

export interface DashboardStats {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  pendingReviewItems: number;
  completionRate: number;
}
