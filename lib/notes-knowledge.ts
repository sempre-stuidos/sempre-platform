import { supabase } from './supabase';
import { NotesKnowledge } from './types';

// Transform database record to match frontend interface
function transformNotesKnowledgeRecord(record: any): NotesKnowledge {
  return {
    id: record.id,
    title: record.title,
    type: record.type,
    status: record.status,
    client: record.client || '',
    project: record.project || '',
    date: record.date,
    author: record.author,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

// Transform frontend interface to database record format
function transformNotesKnowledgeToRecord(notesKnowledge: Partial<NotesKnowledge>) {
  return {
    title: notesKnowledge.title,
    type: notesKnowledge.type,
    status: notesKnowledge.status,
    client: notesKnowledge.client || null,
    project: notesKnowledge.project || null,
    date: notesKnowledge.date,
    author: notesKnowledge.author,
  };
}

export async function getAllNotesKnowledge(): Promise<NotesKnowledge[]> {
  try {
    const { data: notesKnowledge, error } = await supabase
      .from('notes_knowledge')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching notes knowledge:', error);
      throw error;
    }

    if (!notesKnowledge || notesKnowledge.length === 0) {
      return [];
    }

    return notesKnowledge.map(transformNotesKnowledgeRecord);
  } catch (error) {
    console.error('Error in getAllNotesKnowledge:', error);
    return [];
  }
}

export async function getNotesKnowledgeById(id: number): Promise<NotesKnowledge | null> {
  try {
    const { data: notesKnowledge, error } = await supabase
      .from('notes_knowledge')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching notes knowledge by id:', error);
      throw error;
    }

    if (!notesKnowledge) {
      return null;
    }

    return transformNotesKnowledgeRecord(notesKnowledge);
  } catch (error) {
    console.error('Error in getNotesKnowledgeById:', error);
    return null;
  }
}

export async function createNotesKnowledge(notesKnowledge: Omit<NotesKnowledge, 'id' | 'created_at' | 'updated_at'>): Promise<NotesKnowledge | null> {
  try {
    const { data: newNotesKnowledge, error } = await supabase
      .from('notes_knowledge')
      .insert([transformNotesKnowledgeToRecord(notesKnowledge)])
      .select()
      .single();

    if (error) {
      console.error('Error creating notes knowledge:', error);
      throw error;
    }

    if (!newNotesKnowledge) {
      return null;
    }

    return transformNotesKnowledgeRecord(newNotesKnowledge);
  } catch (error) {
    console.error('Error in createNotesKnowledge:', error);
    return null;
  }
}

export async function updateNotesKnowledge(id: number, updates: Partial<NotesKnowledge>): Promise<NotesKnowledge | null> {
  try {
    const { data: updatedNotesKnowledge, error } = await supabase
      .from('notes_knowledge')
      .update(transformNotesKnowledgeToRecord(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating notes knowledge:', error);
      throw error;
    }

    if (!updatedNotesKnowledge) {
      return null;
    }

    return transformNotesKnowledgeRecord(updatedNotesKnowledge);
  } catch (error) {
    console.error('Error in updateNotesKnowledge:', error);
    return null;
  }
}

export async function deleteNotesKnowledge(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notes_knowledge')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notes knowledge:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteNotesKnowledge:', error);
    return false;
  }
}

export async function getNotesKnowledgeByType(type: NotesKnowledge['type']): Promise<NotesKnowledge[]> {
  try {
    const { data: notesKnowledge, error } = await supabase
      .from('notes_knowledge')
      .select('*')
      .eq('type', type)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching notes knowledge by type:', error);
      throw error;
    }

    if (!notesKnowledge || notesKnowledge.length === 0) {
      return [];
    }

    return notesKnowledge.map(transformNotesKnowledgeRecord);
  } catch (error) {
    console.error('Error in getNotesKnowledgeByType:', error);
    return [];
  }
}

export async function getNotesKnowledgeByStatus(status: NotesKnowledge['status']): Promise<NotesKnowledge[]> {
  try {
    const { data: notesKnowledge, error } = await supabase
      .from('notes_knowledge')
      .select('*')
      .eq('status', status)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching notes knowledge by status:', error);
      throw error;
    }

    if (!notesKnowledge || notesKnowledge.length === 0) {
      return [];
    }

    return notesKnowledge.map(transformNotesKnowledgeRecord);
  } catch (error) {
    console.error('Error in getNotesKnowledgeByStatus:', error);
    return [];
  }
}

export async function getNotesKnowledgeByClient(client: string): Promise<NotesKnowledge[]> {
  try {
    const { data: notesKnowledge, error } = await supabase
      .from('notes_knowledge')
      .select('*')
      .eq('client', client)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching notes knowledge by client:', error);
      throw error;
    }

    if (!notesKnowledge || notesKnowledge.length === 0) {
      return [];
    }

    return notesKnowledge.map(transformNotesKnowledgeRecord);
  } catch (error) {
    console.error('Error in getNotesKnowledgeByClient:', error);
    return [];
  }
}

export async function getNotesKnowledgeByAuthor(author: string): Promise<NotesKnowledge[]> {
  try {
    const { data: notesKnowledge, error } = await supabase
      .from('notes_knowledge')
      .select('*')
      .eq('author', author)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching notes knowledge by author:', error);
      throw error;
    }

    if (!notesKnowledge || notesKnowledge.length === 0) {
      return [];
    }

    return notesKnowledge.map(transformNotesKnowledgeRecord);
  } catch (error) {
    console.error('Error in getNotesKnowledgeByAuthor:', error);
    return [];
  }
}
