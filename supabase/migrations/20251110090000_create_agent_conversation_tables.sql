-- Conversations table to track chat sessions per authenticated user
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ
);

-- Messages table storing each message exchanged with the agent
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- State table to store structured metadata about a conversation
CREATE TABLE IF NOT EXISTS conversation_states (
    id BIGSERIAL PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    stage TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes to speed up lookup by owner and conversation
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations (last_message_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_states_conversation_id ON conversation_states (conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_states_stage ON conversation_states (stage);

-- Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_conversation_states_updated_at
    BEFORE UPDATE ON conversation_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_states ENABLE ROW LEVEL SECURITY;

-- RLS policies: users may only interact with their own conversations
CREATE POLICY conversations_select_policy
    ON conversations
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY conversations_insert_policy
    ON conversations
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY conversations_update_policy
    ON conversations
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY conversations_delete_policy
    ON conversations
    FOR DELETE
    USING (user_id = auth.uid());

-- Messages policies: scope access via parent conversation ownership
CREATE POLICY messages_select_policy
    ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = messages.conversation_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY messages_insert_policy
    ON messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = messages.conversation_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY messages_update_policy
    ON messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = messages.conversation_id
              AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = messages.conversation_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY messages_delete_policy
    ON messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = messages.conversation_id
              AND c.user_id = auth.uid()
        )
    );

-- Conversation state policies follow the same pattern
CREATE POLICY conversation_states_select_policy
    ON conversation_states
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = conversation_states.conversation_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY conversation_states_insert_policy
    ON conversation_states
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = conversation_states.conversation_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY conversation_states_update_policy
    ON conversation_states
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = conversation_states.conversation_id
              AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = conversation_states.conversation_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY conversation_states_delete_policy
    ON conversation_states
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = conversation_states.conversation_id
              AND c.user_id = auth.uid()
        )
    );

