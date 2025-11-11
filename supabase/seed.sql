-- Seed data for clients table - ONE RECORD ONLY
INSERT INTO clients (
    name, 
    business_type, 
    status, 
    project_count, 
    priority, 
    contact_email, 
    last_contact, 
    total_value,
    phone,
    address,
    website,
    notes
) VALUES 
    ('Acme Corporation', 'Technology', 'Active', 1, 'High', 'john.doe@acme.com', '2024-01-15', 125000, '+1 (555) 123-4567', '123 Tech Street, San Francisco, CA 94105', 'https://acme.com', 'Key client with multiple ongoing projects');

-- Seed data for projects table - ONE RECORD ONLY
-- Note: progress column was removed by migration 20251002060000_remove_progress_columns.sql
INSERT INTO projects (
    name, 
    client_id, 
    client_name, 
    status, 
    due_date, 
    description, 
    start_date, 
    budget, 
    priority
) VALUES 
    ('E-commerce Platform Redesign', 1, 'Acme Corporation', 'In Progress', '2024-03-15', 'Complete redesign of the e-commerce platform with modern UI/UX and improved performance', '2024-01-01', 75000, 'High');

-- Seed data for project_team_members table - ONE RECORD PER PROJECT
INSERT INTO project_team_members (project_id, member_id, name, role, avatar) VALUES 
    (1, 1, 'Eddie Lake', 'Project Manager', '/avatars/eddie.jpg');

-- Seed data for project_tasks table - ONE RECORD PER PROJECT
INSERT INTO project_tasks (project_id, task_id, title, status, deliverable) VALUES 
    (1, 1, 'Initial client discovery', 'completed', 'Discovery report');

-- Seed data for project_deliverables table - ONE RECORD PER PROJECT
INSERT INTO project_deliverables (project_id, deliverable) VALUES 
    (1, 'Homepage mockup');

-- Seed data for project_timeline table - ONE RECORD PER PROJECT
INSERT INTO project_timeline (project_id, milestone, date, status) VALUES 
    (1, 'Project Kickoff', '2024-01-01', 'completed');

-- Seed data for team_members table - ONE RECORD ONLY
INSERT INTO team_members (
    name, 
    role, 
    status, 
    email, 
    timezone, 
    avatar, 
    current_projects, 
    active_tasks, 
    workload
) VALUES 
    ('Eddie Lake', 'Project Manager', 'Active', 'eddie.lake@agency.com', 'PST (UTC-8)', '/avatars/eddie.jpg', 1, 1, 85);

-- Seed data for team_member_skills table - ONE RECORD PER TEAM MEMBER
INSERT INTO team_member_skills (team_member_id, skill) VALUES 
    (1, 'Project Management'), (1, 'Agile'), (1, 'Scrum');

-- Seed data for team_member_deadlines table - ONE RECORD PER TEAM MEMBER
INSERT INTO team_member_deadlines (team_member_id, project, deadline, type) VALUES 
    (1, 'E-commerce Platform Redesign', '2024-03-15', 'Project Delivery');

-- Seed data for tasks table - ONE RECORD ONLY
-- Note: Using assignee_id to reference team_members table
-- Note: progress column was removed by migration 20251002060000_remove_progress_columns.sql
INSERT INTO tasks (
    title, 
    project_id, 
    assignee_id, 
    status, 
    priority, 
    due_date
) VALUES 
    ('Complete e-commerce wireframes', 1, 1, 'In Progress', 'High', '2024-02-15');

-- Seed data for notes_knowledge table - ONE RECORD ONLY
INSERT INTO notes_knowledge (
    title, 
    type, 
    status, 
    client, 
    project, 
    date, 
    author
) VALUES 
    ('Call with Infinity PM – agreed to include a booking widget', 'Meeting Notes', 'Draft', 'Infinity Corp', 'Website Redesign', '2024-01-15', 'Sarah Chen');

-- Seed data for agency_toolkit table - ONE RECORD ONLY
INSERT INTO agency_toolkit (
    name, 
    logo, 
    category, 
    plan_type, 
    seats, 
    renewal_cycle, 
    price, 
    currency, 
    payment_method, 
    next_billing_date, 
    status, 
    notes
) VALUES 
    ('Figma', '/logos/figma.svg', 'Design', 'Professional', 2, 'Monthly', 15.00, 'USD', 'Credit Card', '2024-03-15', 'Active', 'Used by design team for UI/UX mockups and prototypes');

-- Seed data for agency_toolkit_invoices table - ONE RECORD PER TOOLKIT
INSERT INTO agency_toolkit_invoices (toolkit_id, invoice_id, date, amount, currency, status) VALUES 
    (1, 'INV-001', '2024-02-15', 15.00, 'USD', 'Paid');

-- Seed data for agency_toolkit_cost_history table - ONE RECORD PER TOOLKIT
INSERT INTO agency_toolkit_cost_history (toolkit_id, date, amount, currency) VALUES 
    (1, '2024-02-15', 15.00, 'USD');

-- Seed data for files_assets table - ONE RECORD ONLY
INSERT INTO files_assets (
    name, 
    type, 
    category, 
    project, 
    size, 
    format, 
    uploaded, 
    status
) VALUES 
    ('Client Logo - TechCorp', 'Logo', 'Client Assets', 'TechCorp Website Redesign', '2.4 MB', 'SVG', '2024-01-15', 'Active');

-- Seed data for presentations table - ONE RECORD ONLY
INSERT INTO presentations (
    title, 
    client_id, 
    type, 
    created_date, 
    owner_id, 
    status, 
    link, 
    description, 
    last_modified
) VALUES 
    ('Infinity Property Management – Landing Page Proposal', 1, 'Proposal', '2024-01-15', 1, 'Approved', 'https://gamma.app/p/infinity-property-proposal', 'Comprehensive proposal for landing page redesign including wireframes, mockups, and development timeline', '2024-01-20');
