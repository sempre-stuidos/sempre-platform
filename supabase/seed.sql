-- Seed data for clients table
INSERT INTO clients (
    name, 
    business_type, 
    status, 
    project_count, 
    priority, 
    contact_email, 
    last_contact, 
    total_value
) VALUES 
    ('Acme Corporation', 'Technology', 'Active', 3, 'High', 'john.doe@acme.com', '2024-01-15', 125000),
    ('Global Solutions Inc', 'Consulting', 'Active', 2, 'Medium', 'sarah.smith@globalsolutions.com', '2024-01-10', 85000),
    ('TechStart Ventures', 'Startup', 'Active', 1, 'High', 'mike.johnson@techstart.com', '2024-01-12', 45000),
    ('RetailMax Stores', 'Retail', 'Past', 0, 'Low', 'lisa.brown@retailmax.com', '2023-11-20', 0),
    ('HealthCare Plus', 'Healthcare', 'Active', 4, 'High', 'dr.williams@healthcareplus.com', '2024-01-14', 200000),
    ('FinanceFirst Bank', 'Financial Services', 'Active', 2, 'Medium', 'robert.davis@financefirst.com', '2024-01-08', 150000),
    ('EduTech Learning', 'Education', 'Past', 0, 'Low', 'prof.martinez@edutech.edu', '2023-10-15', 0),
    ('GreenEnergy Corp', 'Energy', 'Active', 1, 'High', 'jennifer.green@greenenergy.com', '2024-01-13', 75000),
    ('ManufacturingWorks', 'Manufacturing', 'Active', 3, 'Medium', 'tom.wilson@manufacturingworks.com', '2024-01-09', 180000),
    ('MediaStream Studios', 'Media & Entertainment', 'Past', 0, 'Low', 'alex.garcia@mediastream.com', '2023-12-05', 0),
    ('LogisticsPro', 'Logistics', 'Active', 2, 'Medium', 'maria.rodriguez@logisticspro.com', '2024-01-11', 95000),
    ('RealEstate Partners', 'Real Estate', 'Active', 1, 'High', 'david.lee@realestatepartners.com', '2024-01-16', 110000),
    ('FoodChain Restaurants', 'Food & Beverage', 'Past', 0, 'Low', 'chef.thompson@foodchain.com', '2023-09-30', 0),
    ('AutoDrive Motors', 'Automotive', 'Active', 2, 'High', 'engineer.kim@autodrive.com', '2024-01-07', 165000),
    ('TravelAgency Plus', 'Travel & Tourism', 'Past', 0, 'Low', 'agent.white@travelagency.com', '2023-08-22', 0);

-- Seed data for projects table
INSERT INTO projects (
    name, 
    client_id, 
    client_name, 
    status, 
    due_date, 
    progress, 
    description, 
    start_date, 
    budget, 
    priority
) VALUES 
    ('E-commerce Platform Redesign', 1, 'Acme Corporation', 'In Progress', '2024-03-15', 65, 'Complete redesign of the e-commerce platform with modern UI/UX and improved performance', '2024-01-01', 75000, 'High'),
    ('Mobile App Development', 2, 'Global Solutions Inc', 'Planned', '2024-04-30', 15, 'Native mobile application for iOS and Android with cross-platform compatibility', '2024-02-01', 120000, 'High'),
    ('Website Migration', 3, 'TechStart Ventures', 'Review', '2024-02-28', 90, 'Migration from legacy system to modern cloud-based platform with improved security', '2023-12-01', 45000, 'Medium'),
    ('Healthcare Portal', 5, 'HealthCare Plus', 'Completed', '2024-01-31', 100, 'Secure patient portal with appointment booking and medical record access', '2023-10-01', 200000, 'High'),
    ('Banking System Integration', 6, 'FinanceFirst Bank', 'In Progress', '2024-05-15', 40, 'Integration of legacy banking systems with modern cloud infrastructure', '2024-01-15', 150000, 'High'),
    ('Green Energy Dashboard', 8, 'GreenEnergy Corp', 'Planned', '2024-06-30', 5, 'Real-time monitoring dashboard for renewable energy production and consumption', '2024-03-01', 75000, 'Medium');

-- Seed data for project_team_members table
INSERT INTO project_team_members (project_id, member_id, name, role, avatar) VALUES 
    -- Project 1 team
    (1, 1, 'Eddie Lake', 'Project Manager', '/avatars/eddie.jpg'),
    (1, 2, 'Maya Johnson', 'UI/UX Designer', '/avatars/maya.jpg'),
    (1, 3, 'Carlos Rodriguez', 'Frontend Developer', '/avatars/carlos.jpg'),
    (1, 4, 'Sarah Chen', 'Backend Developer', '/avatars/sarah.jpg'),
    -- Project 2 team
    (2, 1, 'Eddie Lake', 'Project Manager', '/avatars/eddie.jpg'),
    (2, 5, 'Alex Thompson', 'Mobile Developer', '/avatars/alex.jpg'),
    (2, 6, 'Lisa Wong', 'UI Designer', '/avatars/lisa.jpg'),
    (2, 7, 'David Kim', 'Backend Developer', '/avatars/david.jpg'),
    -- Project 3 team
    (3, 1, 'Eddie Lake', 'Project Manager', '/avatars/eddie.jpg'),
    (3, 8, 'Raj Patel', 'DevOps Engineer', '/avatars/raj.jpg'),
    (3, 9, 'Maria Garcia', 'Backend Developer', '/avatars/maria.jpg'),
    (3, 10, 'James Wilson', 'QA Engineer', '/avatars/james.jpg'),
    -- Project 4 team
    (4, 1, 'Eddie Lake', 'Project Manager', '/avatars/eddie.jpg'),
    (4, 11, 'Dr. Sarah Johnson', 'Medical Consultant', '/avatars/sarah-j.jpg'),
    (4, 12, 'Michael Chen', 'Security Specialist', '/avatars/michael.jpg'),
    (4, 13, 'Emma Davis', 'Frontend Developer', '/avatars/emma.jpg'),
    -- Project 5 team
    (5, 1, 'Eddie Lake', 'Project Manager', '/avatars/eddie.jpg'),
    (5, 14, 'Priya Singh', 'Integration Specialist', '/avatars/priya.jpg'),
    (5, 15, 'Thomas Wilson', 'System Architect', '/avatars/thomas.jpg'),
    (5, 16, 'Nina Patel', 'QA Engineer', '/avatars/nina.jpg'),
    -- Project 6 team
    (6, 1, 'Eddie Lake', 'Project Manager', '/avatars/eddie.jpg'),
    (6, 17, 'Daniel Park', 'Data Analyst', '/avatars/daniel.jpg'),
    (6, 18, 'Leila Ahmadi', 'UI Designer', '/avatars/leila.jpg'),
    (6, 19, 'Sophia Martinez', 'Backend Developer', '/avatars/sophia.jpg');

-- Seed data for project_tasks table
INSERT INTO project_tasks (project_id, task_id, title, status, deliverable) VALUES 
    -- Project 1 tasks
    (1, 1, 'Initial client discovery', 'completed', 'Discovery report'),
    (1, 2, 'Wireframe design', 'in-progress', 'UI mockups'),
    (1, 3, 'SEO setup', 'pending', 'SEO optimization'),
    (1, 4, 'Database optimization', 'completed', 'Performance report'),
    (1, 5, 'Payment integration', 'in-progress', 'Payment system'),
    -- Project 2 tasks
    (2, 1, 'Initial client discovery', 'completed', 'Requirements document'),
    (2, 2, 'Wireframe design', 'pending', 'App wireframes'),
    (2, 3, 'API development', 'pending', 'REST API'),
    (2, 4, 'App architecture', 'in-progress', 'Architecture diagram'),
    (2, 5, 'User testing', 'pending', 'Test results'),
    -- Project 3 tasks
    (3, 1, 'Initial client discovery', 'completed', 'Migration plan'),
    (3, 2, 'Wireframe design', 'completed', 'System design'),
    (3, 3, 'SEO setup', 'completed', 'SEO optimization'),
    (3, 4, 'Data migration', 'completed', 'Data transfer'),
    (3, 5, 'Final testing', 'in-progress', 'Test report'),
    -- Project 4 tasks
    (4, 1, 'Initial client discovery', 'completed', 'Requirements analysis'),
    (4, 2, 'Wireframe design', 'completed', 'Portal mockups'),
    (4, 3, 'SEO setup', 'completed', 'Security framework'),
    (4, 4, 'Security implementation', 'completed', 'Security protocols'),
    (4, 5, 'User acceptance testing', 'completed', 'UAT report'),
    -- Project 5 tasks
    (5, 1, 'Initial client discovery', 'completed', 'Integration plan'),
    (5, 2, 'Wireframe design', 'completed', 'System architecture'),
    (5, 3, 'SEO setup', 'pending', 'API documentation'),
    (5, 4, 'System integration', 'in-progress', 'Integration modules'),
    (5, 5, 'Security audit', 'pending', 'Security report'),
    -- Project 6 tasks
    (6, 1, 'Initial client discovery', 'pending', 'Requirements document'),
    (6, 2, 'Wireframe design', 'pending', 'Dashboard mockups'),
    (6, 3, 'SEO setup', 'pending', 'Data visualization'),
    (6, 4, 'Data pipeline setup', 'pending', 'Data pipeline'),
    (6, 5, 'Dashboard development', 'pending', 'Live dashboard');

-- Seed data for project_deliverables table
INSERT INTO project_deliverables (project_id, deliverable) VALUES 
    -- Project 1 deliverables
    (1, 'Homepage mockup'),
    (1, 'Product catalog redesign'),
    (1, 'Checkout system live'),
    (1, 'Mobile responsive design'),
    (1, 'Performance optimization report'),
    -- Project 2 deliverables
    (2, 'iOS app'),
    (2, 'Android app'),
    (2, 'Backend API'),
    (2, 'Admin dashboard'),
    (2, 'User documentation'),
    -- Project 3 deliverables
    (3, 'Migrated website'),
    (3, 'Security audit report'),
    (3, 'Performance optimization'),
    (3, 'Backup procedures'),
    (3, 'Documentation'),
    -- Project 4 deliverables
    (4, 'Patient portal'),
    (4, 'Admin dashboard'),
    (4, 'Security compliance report'),
    (4, 'User training materials'),
    (4, 'API documentation'),
    -- Project 5 deliverables
    (5, 'Integrated system'),
    (5, 'Migration plan'),
    (5, 'Security documentation'),
    (5, 'Performance report'),
    (5, 'Training materials'),
    -- Project 6 deliverables
    (6, 'Real-time dashboard'),
    (6, 'Data visualization'),
    (6, 'API endpoints'),
    (6, 'Mobile app'),
    (6, 'Analytics report');

-- Seed data for project_timeline table
INSERT INTO project_timeline (project_id, milestone, date, status) VALUES 
    -- Project 1 timeline
    (1, 'Project Kickoff', '2024-01-01', 'completed'),
    (1, 'Design Phase Complete', '2024-02-15', 'completed'),
    (1, 'Development Phase', '2024-03-01', 'in-progress'),
    (1, 'Testing & QA', '2024-03-10', 'pending'),
    (1, 'Launch', '2024-03-15', 'pending'),
    -- Project 2 timeline
    (2, 'Project Kickoff', '2024-02-01', 'completed'),
    (2, 'Design Phase', '2024-02-28', 'pending'),
    (2, 'Development Phase', '2024-04-01', 'pending'),
    (2, 'Testing Phase', '2024-04-20', 'pending'),
    (2, 'App Store Launch', '2024-04-30', 'pending'),
    -- Project 3 timeline
    (3, 'Project Kickoff', '2023-12-01', 'completed'),
    (3, 'Analysis Complete', '2023-12-15', 'completed'),
    (3, 'Migration Phase', '2024-01-15', 'completed'),
    (3, 'Testing Phase', '2024-02-15', 'in-progress'),
    (3, 'Go Live', '2024-02-28', 'pending'),
    -- Project 4 timeline
    (4, 'Project Kickoff', '2023-10-01', 'completed'),
    (4, 'Requirements Analysis', '2023-10-15', 'completed'),
    (4, 'Design Phase', '2023-11-01', 'completed'),
    (4, 'Development Phase', '2023-12-15', 'completed'),
    (4, 'Launch', '2024-01-31', 'completed'),
    -- Project 5 timeline
    (5, 'Project Kickoff', '2024-01-15', 'completed'),
    (5, 'Analysis Phase', '2024-02-01', 'completed'),
    (5, 'Integration Phase', '2024-04-01', 'in-progress'),
    (5, 'Testing Phase', '2024-05-01', 'pending'),
    (5, 'Go Live', '2024-05-15', 'pending'),
    -- Project 6 timeline
    (6, 'Project Kickoff', '2024-03-01', 'pending'),
    (6, 'Data Analysis', '2024-03-15', 'pending'),
    (6, 'Design Phase', '2024-04-01', 'pending'),
    (6, 'Development Phase', '2024-05-15', 'pending'),
    (6, 'Launch', '2024-06-30', 'pending');

-- Seed data for tasks table
INSERT INTO tasks (
    title, 
    project_id, 
    project_name, 
    assignee_name, 
    assignee_role, 
    assignee_avatar, 
    status, 
    priority, 
    due_date, 
    progress
) VALUES 
    ('Complete e-commerce wireframes', 1, 'E-commerce Platform Redesign', 'Maya Johnson', 'UI/UX Designer', '/avatars/maya.jpg', 'In Progress', 'High', '2024-02-15', 65),
    ('Set up payment integration', 1, 'E-commerce Platform Redesign', 'Carlos Rodriguez', 'Frontend Developer', '/avatars/carlos.jpg', 'To Do', 'High', '2024-02-20', 0),
    ('Optimize database queries', 1, 'E-commerce Platform Redesign', 'Sarah Chen', 'Backend Developer', '/avatars/sarah.jpg', 'Done', 'Medium', '2024-02-10', 100),
    ('Create mobile app mockups', 2, 'Mobile App Development', 'Lisa Wong', 'UI Designer', '/avatars/lisa.jpg', 'To Do', 'Medium', '2024-02-25', 0),
    ('Implement user authentication', 2, 'Mobile App Development', 'David Kim', 'Backend Developer', '/avatars/david.jpg', 'In Progress', 'High', '2024-02-18', 40),
    ('Write API documentation', 2, 'Mobile App Development', 'Raj Patel', 'DevOps Engineer', '/avatars/raj.jpg', 'To Do', 'Low', '2024-03-01', 0),
    ('Conduct user testing session', 3, 'Website Migration', 'James Wilson', 'QA Engineer', '/avatars/james.jpg', 'To Do', 'Medium', '2024-02-28', 0),
    ('Deploy to staging environment', 3, 'Website Migration', 'Alex Thompson', 'Mobile Developer', '/avatars/alex.jpg', 'Done', 'High', '2024-02-12', 100),
    ('Review security protocols', 4, 'Healthcare Portal', 'Michael Chen', 'Security Specialist', '/avatars/michael.jpg', 'In Progress', 'High', '2024-02-22', 75),
    ('Update project timeline', 4, 'Healthcare Portal', 'Eddie Lake', 'Project Manager', '/avatars/eddie.jpg', 'Done', 'Low', '2024-02-08', 100);

-- Seed data for team_members table
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
    ('Eddie Lake', 'Project Manager', 'Active', 'eddie.lake@agency.com', 'PST (UTC-8)', '/avatars/eddie.jpg', 3, 12, 85),
    ('Maya Johnson', 'UI/UX Designer', 'Active', 'maya.johnson@agency.com', 'EST (UTC-5)', '/avatars/maya.jpg', 2, 8, 70),
    ('Carlos Rodriguez', 'Frontend Developer', 'Active', 'carlos.rodriguez@agency.com', 'CST (UTC-6)', '/avatars/carlos.jpg', 2, 15, 90),
    ('Sarah Chen', 'Backend Developer', 'Active', 'sarah.chen@agency.com', 'PST (UTC-8)', '/avatars/sarah.jpg', 3, 10, 75),
    ('Alex Thompson', 'Mobile Developer', 'Active', 'alex.thompson@agency.com', 'EST (UTC-5)', '/avatars/alex.jpg', 1, 6, 60),
    ('Lisa Wong', 'UI Designer', 'Contractor', 'lisa.wong@agency.com', 'PST (UTC-8)', '/avatars/lisa.jpg', 1, 4, 40),
    ('David Kim', 'Backend Developer', 'Active', 'david.kim@agency.com', 'KST (UTC+9)', '/avatars/david.jpg', 2, 9, 80),
    ('Raj Patel', 'DevOps Engineer', 'Active', 'raj.patel@agency.com', 'IST (UTC+5:30)', '/avatars/raj.jpg', 2, 7, 65),
    ('Maria Garcia', 'Backend Developer', 'Active', 'maria.garcia@agency.com', 'CST (UTC-6)', '/avatars/maria.jpg', 1, 5, 50),
    ('James Wilson', 'QA Engineer', 'Active', 'james.wilson@agency.com', 'EST (UTC-5)', '/avatars/james.jpg', 2, 8, 70),
    ('Dr. Sarah Johnson', 'Medical Consultant', 'Contractor', 'sarah.johnson@agency.com', 'EST (UTC-5)', '/avatars/sarah-j.jpg', 0, 0, 0),
    ('Michael Chen', 'Security Specialist', 'Active', 'michael.chen@agency.com', 'PST (UTC-8)', '/avatars/michael.jpg', 2, 6, 55),
    ('Emma Davis', 'Frontend Developer', 'Past Collaborator', 'emma.davis@agency.com', 'GMT (UTC+0)', '/avatars/emma.jpg', 0, 0, 0),
    ('Priya Singh', 'Integration Specialist', 'Active', 'priya.singh@agency.com', 'IST (UTC+5:30)', '/avatars/priya.jpg', 1, 11, 85),
    ('Thomas Wilson', 'System Architect', 'Active', 'thomas.wilson@agency.com', 'EST (UTC-5)', '/avatars/thomas.jpg', 2, 7, 75);

-- Seed data for team_member_skills table
INSERT INTO team_member_skills (team_member_id, skill) VALUES 
    -- Eddie Lake skills
    (1, 'Project Management'), (1, 'Agile'), (1, 'Scrum'), (1, 'Team Leadership'), (1, 'Client Relations'),
    -- Maya Johnson skills
    (2, 'UI Design'), (2, 'UX Research'), (2, 'Figma'), (2, 'Prototyping'), (2, 'User Testing'), (2, 'Branding'),
    -- Carlos Rodriguez skills
    (3, 'React'), (3, 'TypeScript'), (3, 'Next.js'), (3, 'Tailwind CSS'), (3, 'JavaScript'), (3, 'HTML/CSS'),
    -- Sarah Chen skills
    (4, 'Node.js'), (4, 'Python'), (4, 'PostgreSQL'), (4, 'MongoDB'), (4, 'REST APIs'), (4, 'GraphQL'), (4, 'Docker'),
    -- Alex Thompson skills
    (5, 'React Native'), (5, 'Flutter'), (5, 'iOS'), (5, 'Android'), (5, 'Swift'), (5, 'Kotlin'), (5, 'Xcode'),
    -- Lisa Wong skills
    (6, 'UI Design'), (6, 'Adobe Creative Suite'), (6, 'Sketch'), (6, 'Illustration'), (6, 'Icon Design'), (6, 'Branding'),
    -- David Kim skills
    (7, 'Java'), (7, 'Spring Boot'), (7, 'Microservices'), (7, 'AWS'), (7, 'Kubernetes'), (7, 'Redis'), (7, 'MySQL'),
    -- Raj Patel skills
    (8, 'AWS'), (8, 'Docker'), (8, 'Kubernetes'), (8, 'Terraform'), (8, 'CI/CD'), (8, 'Monitoring'), (8, 'Linux'),
    -- Maria Garcia skills
    (9, 'PHP'), (9, 'Laravel'), (9, 'MySQL'), (9, 'Redis'), (9, 'Elasticsearch'), (9, 'API Design'), (9, 'Testing'),
    -- James Wilson skills
    (10, 'Manual Testing'), (10, 'Automated Testing'), (10, 'Selenium'), (10, 'Jest'), (10, 'Cypress'), (10, 'Bug Tracking'), (10, 'Test Planning'),
    -- Dr. Sarah Johnson skills
    (11, 'Healthcare Compliance'), (11, 'HIPAA'), (11, 'Medical Workflows'), (11, 'Requirements Analysis'), (11, 'User Research'),
    -- Michael Chen skills
    (12, 'Cybersecurity'), (12, 'Penetration Testing'), (12, 'Security Auditing'), (12, 'Compliance'), (12, 'Risk Assessment'), (12, 'OWASP'),
    -- Emma Davis skills
    (13, 'Vue.js'), (13, 'Angular'), (13, 'JavaScript'), (13, 'CSS'), (13, 'Webpack'), (13, 'Responsive Design'),
    -- Priya Singh skills
    (14, 'System Integration'), (14, 'API Integration'), (14, 'Middleware'), (14, 'Data Mapping'), (14, 'ETL'), (14, 'SOA'),
    -- Thomas Wilson skills
    (15, 'System Architecture'), (15, 'Cloud Architecture'), (15, 'Microservices'), (15, 'Scalability'), (15, 'Performance'), (15, 'Design Patterns');

-- Seed data for team_member_deadlines table
INSERT INTO team_member_deadlines (team_member_id, project, deadline, type) VALUES 
    -- Eddie Lake deadlines
    (1, 'E-commerce Platform Redesign', '2024-03-15', 'Project Delivery'),
    (1, 'Mobile App Development', '2024-04-30', 'Project Kickoff'),
    -- Maya Johnson deadlines
    (2, 'E-commerce Platform Redesign', '2024-03-01', 'Design Review'),
    (2, 'Mobile App Development', '2024-02-28', 'Wireframes'),
    -- Carlos Rodriguez deadlines
    (3, 'E-commerce Platform Redesign', '2024-03-10', 'Frontend Implementation'),
    (3, 'Website Migration', '2024-02-25', 'Code Review'),
    -- Sarah Chen deadlines
    (4, 'E-commerce Platform Redesign', '2024-03-05', 'API Development'),
    (4, 'Banking System Integration', '2024-04-01', 'Integration Testing'),
    -- Alex Thompson deadlines
    (5, 'Mobile App Development', '2024-04-15', 'App Store Submission'),
    -- Lisa Wong deadlines
    (6, 'Mobile App Development', '2024-02-20', 'Icon Set Delivery'),
    -- David Kim deadlines
    (7, 'Mobile App Development', '2024-03-20', 'API Documentation'),
    (7, 'Banking System Integration', '2024-04-10', 'Security Audit'),
    -- Raj Patel deadlines
    (8, 'Website Migration', '2024-02-28', 'Production Deployment'),
    (8, 'Banking System Integration', '2024-03-15', 'Infrastructure Setup'),
    -- Maria Garcia deadlines
    (9, 'Website Migration', '2024-02-25', 'Database Migration'),
    -- James Wilson deadlines
    (10, 'Website Migration', '2024-02-28', 'Final Testing'),
    (10, 'E-commerce Platform Redesign', '2024-03-12', 'QA Review'),
    -- Michael Chen deadlines
    (12, 'Banking System Integration', '2024-03-30', 'Security Audit'),
    (12, 'Healthcare Portal', '2024-02-15', 'Compliance Review'),
    -- Priya Singh deadlines
    (14, 'Banking System Integration', '2024-04-20', 'Integration Testing'),
    -- Thomas Wilson deadlines
    (15, 'Banking System Integration', '2024-03-05', 'Architecture Review'),
    (15, 'Green Energy Dashboard', '2024-03-15', 'System Design');

-- Seed data for notes_knowledge table
INSERT INTO notes_knowledge (
    title, 
    type, 
    status, 
    client, 
    project, 
    date, 
    author
) VALUES 
    ('Call with Infinity PM – agreed to include a booking widget', 'Meeting Notes', 'Draft', 'Infinity Corp', 'Website Redesign', '2024-01-15', 'Sarah Chen'),
    ('Q4 Strategy Planning Session', 'Meeting Notes', 'Published', 'TechStart Inc', 'Digital Transformation', '2024-01-10', 'Eddie Lake'),
    ('Landing Page Build', 'Internal Playbook', 'Template', '', '', '2024-01-01', 'Jamik Tashpulatov'),
    ('SEO Campaign Setup', 'Internal Playbook', 'Template', '', '', '2024-01-01', 'Maya Johnson'),
    ('Monthly Report Template', 'Internal Playbook', 'Template', '', '', '2024-01-01', 'Carlos Rodriguez'),
    ('Client Onboarding Process', 'Internal Playbook', 'Template', '', '', '2024-01-01', 'Sarah Chen'),
    ('Brand Guidelines Discussion', 'Meeting Notes', 'Draft', 'Creative Agency', 'Brand Identity', '2024-01-12', 'Leila Ahmadi'),
    ('E-commerce Integration Requirements', 'Meeting Notes', 'Published', 'Retail Plus', 'E-commerce Platform', '2024-01-14', 'Thomas Wilson'),
    ('Social Media Campaign Template', 'Internal Playbook', 'Template', '', '', '2024-01-01', 'Nina Patel'),
    ('Content Strategy Workshop', 'Meeting Notes', 'Archived', 'Media Group', 'Content Marketing', '2024-01-08', 'David Kim'),
    ('Research on AI Integration', 'Research Notes', 'Draft', '', '', '2024-01-16', 'Alex Thompson'),
    ('Bug Report - Login Issue', 'Bug Report', 'Open', 'TechStart Inc', 'Mobile App', '2024-01-17', 'Raj Patel'),
    ('Feature Request - Dark Mode', 'Feature Request', 'Under Review', 'Creative Agency', 'Website Redesign', '2024-01-18', 'James Wilson'),
    ('Team Standup Notes', 'Standup Notes', 'Published', '', '', '2024-01-19', 'Michael Chen'),
    ('Code Review Guidelines', 'Documentation', 'Published', '', '', '2024-01-20', 'Lisa Wong'),
    ('Client Feedback Session', 'Meeting Notes', 'Draft', 'HealthTech', 'Mobile App', '2024-01-13', 'Daniel Park'),
    ('Security Audit Process', 'Internal Playbook', 'Template', '', '', '2024-01-01', 'Sarah Johnson'),
    ('Project Kickoff Meeting', 'Meeting Notes', 'Published', 'EduTech', 'Learning Platform', '2024-01-17', 'Emma Davis'),
    ('Quality Assurance Testing', 'Internal Playbook', 'Template', '', '', '2024-01-01', 'Priya Singh'),
    ('Stakeholder Update Call', 'Meeting Notes', 'Archived', 'Enterprise Solutions', 'CRM Implementation', '2024-01-09', 'Maria Garcia');

-- Seed data for agency_toolkit table
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
    ('Figma', '/logos/figma.svg', 'Design', 'Professional', 2, 'Monthly', 15.00, 'USD', 'Credit Card', '2024-03-15', 'Active', 'Used by design team for UI/UX mockups and prototypes'),
    ('Vercel', '/logos/vercel.svg', 'Hosting', 'Pro', 1, 'Monthly', 20.00, 'USD', 'Credit Card', '2024-03-20', 'Active', 'Hosting for client websites and staging environments'),
    ('Netlify', '/logos/netlify.svg', 'Hosting', 'Business', 3, 'Yearly', 19.00, 'USD', 'PayPal', '2024-12-01', 'Active', 'CDN and hosting for static sites and client projects'),
    ('Email.js', '/logos/emailjs.svg', 'Productivity', 'Pro', 1, 'Monthly', 25.00, 'USD', 'Credit Card', '2024-03-10', 'Active', 'Email service for contact forms and client communications'),
    ('Canva Pro', '/logos/canva.svg', 'Design', 'Pro', 5, 'Yearly', 12.99, 'USD', 'Credit Card', '2024-08-15', 'Active', 'Graphic design tool for social media and marketing materials'),
    ('Notion', '/logos/notion.svg', 'Productivity', 'Business', 10, 'Monthly', 8.00, 'USD', 'Credit Card', '2024-03-05', 'Active', 'Project management and documentation for all team members'),
    ('Slack', '/logos/slack.svg', 'Productivity', 'Pro', 8, 'Monthly', 7.25, 'USD', 'Credit Card', '2024-03-12', 'Active', 'Team communication and client collaboration'),
    ('Adobe Creative Cloud', '/logos/adobe.svg', 'Design', 'Business', 3, 'Monthly', 52.99, 'USD', 'Credit Card', '2024-03-25', 'Trial', 'Full suite of design tools for advanced projects'),
    ('GitHub', '/logos/github.svg', 'Productivity', 'Team', 5, 'Monthly', 4.00, 'USD', 'Credit Card', '2024-03-18', 'Active', 'Version control and code collaboration'),
    ('Loom', '/logos/loom.svg', 'Productivity', 'Business', 1, 'Monthly', 8.00, 'USD', 'Credit Card', '2024-03-08', 'Canceled', 'Screen recording for client demos and tutorials');

-- Seed data for agency_toolkit_invoices table
INSERT INTO agency_toolkit_invoices (toolkit_id, invoice_id, date, amount, currency, status) VALUES 
    -- Figma invoices
    (1, 'INV-001', '2024-02-15', 15.00, 'USD', 'Paid'),
    -- Vercel invoices
    (2, 'INV-002', '2024-02-20', 20.00, 'USD', 'Paid'),
    -- Netlify invoices
    (3, 'INV-003', '2023-12-01', 228.00, 'USD', 'Paid'),
    -- Email.js invoices
    (4, 'INV-004', '2024-02-10', 25.00, 'USD', 'Paid'),
    -- Canva Pro invoices
    (5, 'INV-005', '2023-08-15', 155.88, 'USD', 'Paid'),
    -- Notion invoices
    (6, 'INV-006', '2024-02-05', 8.00, 'USD', 'Paid'),
    -- Slack invoices
    (7, 'INV-007', '2024-02-12', 7.25, 'USD', 'Paid'),
    -- GitHub invoices
    (9, 'INV-009', '2024-02-18', 4.00, 'USD', 'Paid'),
    -- Loom invoices
    (10, 'INV-010', '2024-02-08', 8.00, 'USD', 'Paid');

-- Seed data for agency_toolkit_cost_history table
INSERT INTO agency_toolkit_cost_history (toolkit_id, date, amount, currency) VALUES 
    -- Figma cost history
    (1, '2024-02-15', 15.00, 'USD'),
    (1, '2024-01-15', 15.00, 'USD'),
    (1, '2023-12-15', 15.00, 'USD'),
    -- Vercel cost history
    (2, '2024-02-20', 20.00, 'USD'),
    (2, '2024-01-20', 20.00, 'USD'),
    (2, '2023-12-20', 20.00, 'USD'),
    -- Netlify cost history
    (3, '2023-12-01', 228.00, 'USD'),
    -- Email.js cost history
    (4, '2024-02-10', 25.00, 'USD'),
    (4, '2024-01-10', 25.00, 'USD'),
    (4, '2023-12-10', 25.00, 'USD'),
    -- Canva Pro cost history
    (5, '2023-08-15', 155.88, 'USD'),
    -- Notion cost history
    (6, '2024-02-05', 8.00, 'USD'),
    (6, '2024-01-05', 8.00, 'USD'),
    (6, '2023-12-05', 8.00, 'USD'),
    -- Slack cost history
    (7, '2024-02-12', 7.25, 'USD'),
    (7, '2024-01-12', 7.25, 'USD'),
    (7, '2023-12-12', 7.25, 'USD'),
    -- GitHub cost history
    (9, '2024-02-18', 4.00, 'USD'),
    (9, '2024-01-18', 4.00, 'USD'),
    (9, '2023-12-18', 4.00, 'USD'),
    -- Loom cost history
    (10, '2024-02-08', 8.00, 'USD'),
    (10, '2024-01-08', 8.00, 'USD'),
    (10, '2023-12-08', 8.00, 'USD');

-- Seed data for files_assets table
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
    ('Client Logo - TechCorp', 'Logo', 'Client Assets', 'TechCorp Website Redesign', '2.4 MB', 'SVG', '2024-01-15', 'Active'),
    ('Brand Guidelines - TechCorp', 'Document', 'Client Assets', 'TechCorp Website Redesign', '15.2 MB', 'PDF', '2024-01-14', 'Active'),
    ('Homepage Mockup v2', 'Mockup', 'Project Assets', 'TechCorp Website Redesign', '8.7 MB', 'PNG', '2024-01-13', 'Review'),
    ('Content Draft - About Page', 'Content', 'Project Assets', 'TechCorp Website Redesign', '0.3 MB', 'DOCX', '2024-01-12', 'Draft'),
    ('Product Images - E-commerce', 'Images', 'Client Assets', 'E-commerce Platform', '45.8 MB', 'ZIP', '2024-01-11', 'Active'),
    ('Wireframes - Mobile App', 'Wireframe', 'Project Assets', 'Mobile App Development', '12.3 MB', 'Figma', '2024-01-10', 'Active'),
    ('Client Logo - StartupXYZ', 'Logo', 'Client Assets', 'StartupXYZ Branding', '1.8 MB', 'SVG', '2024-01-09', 'Active'),
    ('Style Guide - StartupXYZ', 'Document', 'Client Assets', 'StartupXYZ Branding', '22.1 MB', 'PDF', '2024-01-08', 'Active'),
    ('Content Strategy Document', 'Document', 'Project Assets', 'Content Marketing Campaign', '3.2 MB', 'PDF', '2024-01-07', 'Review'),
    ('Social Media Templates', 'Templates', 'Project Assets', 'Social Media Campaign', '18.5 MB', 'PSD', '2024-01-06', 'Active'),
    ('Client Photos - Corporate', 'Images', 'Client Assets', 'Corporate Website', '67.2 MB', 'ZIP', '2024-01-05', 'Active'),
    ('Prototype - Dashboard UI', 'Prototype', 'Project Assets', 'Dashboard Redesign', '25.4 MB', 'Figma', '2024-01-04', 'Review'),
    ('Brand Colors Palette', 'Design System', 'Client Assets', 'Brand Identity Design', '0.8 MB', 'AI', '2024-01-03', 'Active'),
    ('Content Calendar Template', 'Template', 'Project Assets', 'Content Planning', '0.5 MB', 'XLSX', '2024-01-02', 'Active'),
    ('Video Assets - Promo', 'Video', 'Project Assets', 'Marketing Campaign', '156.7 MB', 'MP4', '2024-01-01', 'Processing'),
    ('Client Logo - GlobalTech', 'Logo', 'Client Assets', 'GlobalTech Rebrand', '3.1 MB', 'SVG', '2023-12-31', 'Active'),
    ('User Research Report', 'Document', 'Project Assets', 'UX Research Study', '8.9 MB', 'PDF', '2023-12-30', 'Review'),
    ('Icon Set - Custom', 'Icons', 'Project Assets', 'Design System', '4.2 MB', 'SVG', '2023-12-29', 'Active'),
    ('Client Presentation Deck', 'Presentation', 'Client Assets', 'Q4 Review', '28.3 MB', 'PPTX', '2023-12-28', 'Active'),
    ('Website Screenshots', 'Images', 'Project Assets', 'Website Audit', '12.6 MB', 'PNG', '2023-12-27', 'Archive');
