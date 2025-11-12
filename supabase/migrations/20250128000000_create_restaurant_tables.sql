-- ============================================================================
-- Restaurant Management Tables
-- Creates tables for menu items, gallery images, and page sections
-- ============================================================================

-- ============================================================================
-- Menu Items Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS menu_items (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2),
    category TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_client_id ON menu_items(client_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_menu_items_updated_at 
    BEFORE UPDATE ON menu_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Clients can only access their own menu items
CREATE POLICY "Clients can view their own menu items" ON menu_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN user_roles ur ON ur.role = 'Client'
            JOIN auth.users u ON u.id = ur.user_id
            WHERE c.id = menu_items.client_id
            AND LOWER(c.contact_email) = LOWER(u.email)
            AND auth.uid() = u.id
        )
    );

CREATE POLICY "Clients can insert their own menu items" ON menu_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN user_roles ur ON ur.role = 'Client'
            JOIN auth.users u ON u.id = ur.user_id
            WHERE c.id = menu_items.client_id
            AND LOWER(c.contact_email) = LOWER(u.email)
            AND auth.uid() = u.id
        )
    );

CREATE POLICY "Clients can update their own menu items" ON menu_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN user_roles ur ON ur.role = 'Client'
            JOIN auth.users u ON u.id = ur.user_id
            WHERE c.id = menu_items.client_id
            AND LOWER(c.contact_email) = LOWER(u.email)
            AND auth.uid() = u.id
        )
    );

CREATE POLICY "Clients can delete their own menu items" ON menu_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN user_roles ur ON ur.role = 'Client'
            JOIN auth.users u ON u.id = ur.user_id
            WHERE c.id = menu_items.client_id
            AND LOWER(c.contact_email) = LOWER(u.email)
            AND auth.uid() = u.id
        )
    );

-- Allow authenticated non-client users (admins, etc.) to view all menu items
CREATE POLICY "Authenticated users can view all menu items" ON menu_items
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        NOT EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'Client'
        )
    );

-- ============================================================================
-- Gallery Images Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS gallery_images (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gallery_images_client_id ON gallery_images(client_id);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_gallery_images_updated_at 
    BEFORE UPDATE ON gallery_images 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Clients can only access their own gallery images
CREATE POLICY "Clients can view their own gallery images" ON gallery_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN user_roles ur ON ur.role = 'Client'
            JOIN auth.users u ON u.id = ur.user_id
            WHERE c.id = gallery_images.client_id
            AND LOWER(c.contact_email) = LOWER(u.email)
            AND auth.uid() = u.id
        )
    );

CREATE POLICY "Clients can insert their own gallery images" ON gallery_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN user_roles ur ON ur.role = 'Client'
            JOIN auth.users u ON u.id = ur.user_id
            WHERE c.id = gallery_images.client_id
            AND LOWER(c.contact_email) = LOWER(u.email)
            AND auth.uid() = u.id
        )
    );

CREATE POLICY "Clients can update their own gallery images" ON gallery_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN user_roles ur ON ur.role = 'Client'
            JOIN auth.users u ON u.id = ur.user_id
            WHERE c.id = gallery_images.client_id
            AND LOWER(c.contact_email) = LOWER(u.email)
            AND auth.uid() = u.id
        )
    );

CREATE POLICY "Clients can delete their own gallery images" ON gallery_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN user_roles ur ON ur.role = 'Client'
            JOIN auth.users u ON u.id = ur.user_id
            WHERE c.id = gallery_images.client_id
            AND LOWER(c.contact_email) = LOWER(u.email)
            AND auth.uid() = u.id
        )
    );

-- Allow authenticated non-client users to view all gallery images
CREATE POLICY "Authenticated users can view all gallery images" ON gallery_images
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        NOT EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'Client'
        )
    );

-- ============================================================================
-- Page Sections Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS page_sections (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    section_name TEXT NOT NULL,
    title TEXT,
    content TEXT,
    image_url TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(client_id, section_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_page_sections_client_id ON page_sections(client_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_section_name ON page_sections(section_name);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_page_sections_updated_at 
    BEFORE UPDATE ON page_sections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Clients can only access their own page sections
CREATE POLICY "Clients can view their own page sections" ON page_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN user_roles ur ON ur.role = 'Client'
            JOIN auth.users u ON u.id = ur.user_id
            WHERE c.id = page_sections.client_id
            AND LOWER(c.contact_email) = LOWER(u.email)
            AND auth.uid() = u.id
        )
    );

CREATE POLICY "Clients can insert their own page sections" ON page_sections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN user_roles ur ON ur.role = 'Client'
            JOIN auth.users u ON u.id = ur.user_id
            WHERE c.id = page_sections.client_id
            AND LOWER(c.contact_email) = LOWER(u.email)
            AND auth.uid() = u.id
        )
    );

CREATE POLICY "Clients can update their own page sections" ON page_sections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN user_roles ur ON ur.role = 'Client'
            JOIN auth.users u ON u.id = ur.user_id
            WHERE c.id = page_sections.client_id
            AND LOWER(c.contact_email) = LOWER(u.email)
            AND auth.uid() = u.id
        )
    );

CREATE POLICY "Clients can delete their own page sections" ON page_sections
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN user_roles ur ON ur.role = 'Client'
            JOIN auth.users u ON u.id = ur.user_id
            WHERE c.id = page_sections.client_id
            AND LOWER(c.contact_email) = LOWER(u.email)
            AND auth.uid() = u.id
        )
    );

-- Allow authenticated non-client users to view all page sections
CREATE POLICY "Authenticated users can view all page sections" ON page_sections
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        NOT EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'Client'
        )
    );

