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

export interface Client {
  id: number;
  name: string;
  businessType: string;
  status: 'Active' | 'Past';
  projectCount: number;
  priority: 'High' | 'Medium' | 'Low';
  contactEmail: string;
  lastContact: string;
  totalValue: number;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar: string;
}

export interface ProjectTask {
  id: number;
  title: string;
  status: 'completed' | 'in-progress' | 'pending';
  deliverable: string;
}

export interface TimelineMilestone {
  milestone: string;
  date: string;
  status: 'completed' | 'in-progress' | 'pending';
}

export interface Project {
  id: number;
  name: string;
  clientId: number;
  clientName: string;
  status: 'Completed' | 'In Progress' | 'Review' | 'Planned';
  dueDate: string;
  progress: number;
  description: string;
  startDate: string;
  budget: number;
  priority: 'High' | 'Medium' | 'Low';
  teamMembers: TeamMember[];
  tasks: ProjectTask[];
  deliverables: string[];
  timeline: TimelineMilestone[];
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: number;
  title: string;
  projectId: number;
  projectName: string;
  assigneeName: string;
  assigneeRole: string;
  assigneeAvatar: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  progress: number;
  created_at?: string;
  updated_at?: string;
}

export interface Deadline {
  project: string;
  deadline: string;
  type: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  status: 'Active' | 'Contractor' | 'Past Collaborator';
  email: string;
  timezone: string;
  avatar: string;
  skills: string[];
  currentProjects: number;
  activeTasks: number;
  upcomingDeadlines: Deadline[];
  workload: number;
  created_at?: string;
  updated_at?: string;
}

export interface NotesKnowledge {
  id: number;
  title: string;
  type: 'Meeting Notes' | 'Internal Playbook' | 'Research Notes' | 'Bug Report' | 'Feature Request' | 'Standup Notes' | 'Documentation';
  status: 'Draft' | 'Published' | 'Archived' | 'Template' | 'Open' | 'Under Review';
  client: string;
  project: string;
  date: string;
  author: string;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface CostHistory {
  date: string;
  amount: number;
  currency: string;
}

export interface AgencyToolkit {
  id: number;
  name: string;
  logo: string;
  category: 'Design' | 'Hosting' | 'AI' | 'Marketing' | 'Productivity';
  planType: string;
  seats: number;
  renewalCycle: 'Monthly' | 'Yearly';
  price: number;
  currency: string;
  paymentMethod: string;
  nextBillingDate: string;
  status: 'Active' | 'Trial' | 'Canceled';
  notes: string;
  invoices: Invoice[];
  costHistory: CostHistory[];
  created_at?: string;
  updated_at?: string;
}

export interface FilesAssets {
  id: number;
  name: string;
  type: 'Logo' | 'Document' | 'Mockup' | 'Content' | 'Images' | 'Wireframe' | 'Prototype' | 'Templates' | 'Video' | 'Design System' | 'Icons' | 'Presentation' | 'Template';
  category: 'Client Assets' | 'Project Assets';
  project: string;
  size: string;
  format: string;
  uploaded: string;
  status: 'Active' | 'Review' | 'Draft' | 'Processing' | 'Archive';
  created_at?: string;
  updated_at?: string;
}
