-- Add 'Proposal' type to notes_knowledge table type constraint
ALTER TABLE notes_knowledge DROP CONSTRAINT IF EXISTS notes_knowledge_type_check;
ALTER TABLE notes_knowledge ADD CONSTRAINT notes_knowledge_type_check 
  CHECK (type IN ('Proposal', 'Meeting Notes', 'Internal Playbook', 'Research Notes', 'Bug Report', 'Feature Request', 'Standup Notes', 'Documentation'));

