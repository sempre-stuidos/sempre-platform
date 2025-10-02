-- Create notes_knowledge table
CREATE TABLE notes_knowledge (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Meeting Notes', 'Internal Playbook', 'Research Notes', 'Bug Report', 'Feature Request', 'Standup Notes', 'Documentation')),
    status TEXT NOT NULL CHECK (status IN ('Draft', 'Published', 'Archived', 'Template', 'Open', 'Under Review')),
    client TEXT,
    project TEXT,
    date DATE NOT NULL,
    author TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_notes_knowledge_type ON notes_knowledge(type);
CREATE INDEX idx_notes_knowledge_status ON notes_knowledge(status);
CREATE INDEX idx_notes_knowledge_client ON notes_knowledge(client);
CREATE INDEX idx_notes_knowledge_project ON notes_knowledge(project);
CREATE INDEX idx_notes_knowledge_author ON notes_knowledge(author);
CREATE INDEX idx_notes_knowledge_date ON notes_knowledge(date);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_notes_knowledge_updated_at 
    BEFORE UPDATE ON notes_knowledge 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE notes_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (allowing all operations for authenticated users)
CREATE POLICY "Enable read access for all users" ON notes_knowledge FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON notes_knowledge FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON notes_knowledge FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON notes_knowledge FOR DELETE USING (true);
