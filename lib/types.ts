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
  activeClients: number;
  clientGrowth: number;
  activeProjects: number;
  projectProgress: number;
  tasksThisWeek: number;
  recentNotes: number;
  notesToday: number;
}

export interface ClientDashboardStats {
  menuItemsCount: number;
  galleryImagesCount: number;
  sectionsCount: number;
}

export interface DashboardChartData {
  month: string;
  date: string;
  completed: number;
  inProgress: number;
  pending: number;
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
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMember {
  id: number;
  name: string | null;
  role: string;
  status: 'Active' | 'Contractor' | 'Past Collaborator';
  email: string;
  timezone: string | null;
  avatar?: string;
  currentProjects?: number;
  activeTasks?: number;
  workload?: number;
  skills?: string[];
  upcomingDeadlines?: Deadline[];
  auth_user_id?: string | null;
  invited_email?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectTask {
  id: number;
  title: string;
  status: 'completed' | 'in-progress' | 'pending';
  deliverable: string;
  priority: string;
  dueDate: string;
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
  description: string;
  startDate: string;
  budget: number;
  priority: 'High' | 'Medium' | 'Low';
  progress?: number;
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
  assigneeId: number | null;
  status: 'To Do' | 'In Progress' | 'Review' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  progress?: number;
  // Derived fields populated from related tables
  projectName?: string;
  assigneeName?: string;
  assigneeRole?: string;
  assigneeAvatar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Deadline {
  project: string;
  deadline: string;
  type: string;
}


export interface NotesKnowledge {
  id: number;
  title: string;
  type: 'Proposal' | 'Meeting Notes' | 'Internal Playbook' | 'Research Notes' | 'Bug Report' | 'Feature Request' | 'Standup Notes' | 'Documentation' | 'notion';
  status: 'Draft' | 'Published' | 'Archived' | 'Template' | 'Open' | 'Under Review';
  clientId: number | null;
  clientName?: string;
  projectId: number | null;
  projectName?: string;
  date: string;
  author: string;
  content?: string;
  notion_url?: string;
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
  file_url?: string;
  google_drive_file_id?: string;
  google_drive_web_view_link?: string;
  imported_from_google_drive?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Presentation {
  id: number;
  title: string;
  clientId: number;
  clientName: string;
  type: 'Proposal' | 'Onboarding' | 'Progress Update' | 'Report' | 'Case Study' | null;
  createdDate: string;
  ownerId: number | null;
  ownerName: string | null;
  status: 'Draft' | 'Sent' | 'Approved' | 'Archived' | null;
  link: string;
  description?: string;
  lastModified?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GalleryImage {
  id: number;
  clientId: number;
  imageUrl: string;
  title?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type MenuType = 'brunch' | 'dinner' | 'lunch' | 'breakfast' | 'dessert' | null;

export interface Menu {
  id: number;
  organizationId: string;
  name: string;
  description?: string;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: number;
  menuId: number;
  menuType?: MenuType;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  created_at: string;
  updated_at: string;
  // Keep for backward compatibility during transition
  clientId?: number;
}

export interface MenuItem {
  id: number;
  menuId: number;
  menuCategoryId?: number;
  menuType?: MenuType;
  name: string;
  description?: string;
  price?: number; // Keep for backward compatibility
  priceCents?: number; // New field - price in cents
  category?: string; // Keep for backward compatibility
  imageUrl?: string;
  isVisible: boolean;
  isFeatured: boolean;
  position: number;
  isArchived: boolean;
  archivedAt?: string;
  created_at: string;
  updated_at: string;
  // Keep for backward compatibility during transition
  clientId?: number;
}

export interface PageSection {
  id: number;
  clientId: number;
  sectionName: string;
  title?: string;
  content?: string;
  imageUrl?: string;
  order?: number;
  created_at: string;
  updated_at: string;
}

// New page management types
export interface Page {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  template?: string;
  status: 'published' | 'dirty' | 'draft';
  base_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PageSectionV2 {
  id: string;
  page_id: string;
  org_id: string;
  key: string;
  label: string;
  component: string;
  position: number;
  published_content: Record<string, unknown>;
  draft_content: Record<string, unknown>;
  status: 'published' | 'dirty' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface PageWithSections extends Page {
  sections: PageSectionV2[];
}

export interface PreviewToken {
  id: string;
  org_id: string;
  page_id?: string;
  section_id?: string;
  user_id?: string;
  expires_at: string;
  created_at: string;
}

export interface PageInput {
  name: string;
  slug: string;
  template?: string;
  status?: 'published' | 'dirty' | 'draft';
}

export interface Event {
  id: string;
  org_id: string;
  title: string;
  short_description?: string;
  description?: string;
  image_url?: string;
  event_type?: string;
  starts_at: string; // ISO datetime string
  ends_at: string; // ISO datetime string
  publish_start_at?: string; // ISO datetime string
  publish_end_at?: string; // ISO datetime string
  status: 'draft' | 'scheduled' | 'live' | 'past' | 'archived';
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export type FeedbackStatus = 'open' | 'in_progress' | 'resolved';
export type FeedbackPriority = 'high' | 'medium' | 'low';

export interface FeedbackComment {
  id: string;
  feedbackId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  body: string;
  createdAt: string;
}

export interface FeedbackItem {
  id: string;
  pageId: string;
  orgId: string;
  sectionId: string;
  sectionKey: string;
  componentKey: string | null;
  x: number;
  y: number;
  xRatio: number;
  yRatio: number;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar: string;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
  comments: FeedbackComment[];
}
