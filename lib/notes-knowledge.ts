import { supabase } from './supabase';
import { NotesKnowledge } from './types';

// Transform database record to match frontend interface
function transformNotesKnowledgeRecord(record: Record<string, unknown>): NotesKnowledge {
  return {
    id: record.id as number,
    title: record.title as string,
    type: record.type as NotesKnowledge['type'],
    status: record.status as NotesKnowledge['status'],
    clientId: record.client_id as number | null,
    clientName: record.client_name as string | undefined,
    projectId: record.project_id as number | null,
    projectName: record.project_name as string | undefined,
    date: record.date as string,
    author: record.author as string,
    content: (record.content as string) || '',
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}

// Transform frontend interface to database record format
function transformNotesKnowledgeToRecord(notesKnowledge: Partial<NotesKnowledge>) {
  return {
    title: notesKnowledge.title,
    type: notesKnowledge.type,
    status: notesKnowledge.status,
    client_id: notesKnowledge.clientId || null,
    project_id: notesKnowledge.projectId || null,
    date: notesKnowledge.date,
    author: notesKnowledge.author,
    content: notesKnowledge.content || null,
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

    // Get client and project names separately
    const clientIds = [...new Set(notesKnowledge.map(n => n.client_id).filter(Boolean))];
    const projectIds = [...new Set(notesKnowledge.map(n => n.project_id).filter(Boolean))];

    const [clientsData, projectsData] = await Promise.all([
      clientIds.length > 0 ? supabase.from('clients').select('id, name').in('id', clientIds) : { data: [] },
      projectIds.length > 0 ? supabase.from('projects').select('id, name').in('id', projectIds) : { data: [] }
    ]);

    const clientsMap = new Map((clientsData.data || []).map(c => [c.id, c.name]));
    const projectsMap = new Map((projectsData.data || []).map(p => [p.id, p.name]));

    return notesKnowledge.map(record => {
      const transformed = transformNotesKnowledgeRecord(record);
      // Add the joined names
      if (record.client_id && clientsMap.has(record.client_id)) {
        transformed.clientName = clientsMap.get(record.client_id);
      }
      if (record.project_id && projectsMap.has(record.project_id)) {
        transformed.projectName = projectsMap.get(record.project_id);
      }
      return transformed;
    });
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

    const transformed = transformNotesKnowledgeRecord(notesKnowledge);
    
    // Get client and project names separately if they exist
    if (notesKnowledge.client_id) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('name')
        .eq('id', notesKnowledge.client_id)
        .single();
      
      if (clientData) {
        transformed.clientName = clientData.name;
      }
    }

    if (notesKnowledge.project_id) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('name')
        .eq('id', notesKnowledge.project_id)
        .single();
      
      if (projectData) {
        transformed.projectName = projectData.name;
      }
    }

    return transformed;
  } catch (error) {
    console.error('Error in getNotesKnowledgeById:', error);
    return null;
  }
}

export async function createNotesKnowledge(notesKnowledge: Omit<NotesKnowledge, 'id' | 'created_at' | 'updated_at'>): Promise<NotesKnowledge | null> {
  try {
    const record = transformNotesKnowledgeToRecord(notesKnowledge);
    console.log('Creating note with data:', record);
    
    const { data: newNotesKnowledge, error } = await supabase
      .from('notes_knowledge')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating notes knowledge:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
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

    // Get client and project names separately
    const clientIds = [...new Set(notesKnowledge.map(n => n.client_id).filter(Boolean))];
    const projectIds = [...new Set(notesKnowledge.map(n => n.project_id).filter(Boolean))];

    const [clientsData, projectsData] = await Promise.all([
      clientIds.length > 0 ? supabase.from('clients').select('id, name').in('id', clientIds) : { data: [] },
      projectIds.length > 0 ? supabase.from('projects').select('id, name').in('id', projectIds) : { data: [] }
    ]);

    const clientsMap = new Map((clientsData.data || []).map(c => [c.id, c.name]));
    const projectsMap = new Map((projectsData.data || []).map(p => [p.id, p.name]));

    return notesKnowledge.map(record => {
      const transformed = transformNotesKnowledgeRecord(record);
      // Add the joined names
      if (record.client_id && clientsMap.has(record.client_id)) {
        transformed.clientName = clientsMap.get(record.client_id);
      }
      if (record.project_id && projectsMap.has(record.project_id)) {
        transformed.projectName = projectsMap.get(record.project_id);
      }
      return transformed;
    });
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

    // Get client and project names separately
    const clientIds = [...new Set(notesKnowledge.map(n => n.client_id).filter(Boolean))];
    const projectIds = [...new Set(notesKnowledge.map(n => n.project_id).filter(Boolean))];

    const [clientsData, projectsData] = await Promise.all([
      clientIds.length > 0 ? supabase.from('clients').select('id, name').in('id', clientIds) : { data: [] },
      projectIds.length > 0 ? supabase.from('projects').select('id, name').in('id', projectIds) : { data: [] }
    ]);

    const clientsMap = new Map((clientsData.data || []).map(c => [c.id, c.name]));
    const projectsMap = new Map((projectsData.data || []).map(p => [p.id, p.name]));

    return notesKnowledge.map(record => {
      const transformed = transformNotesKnowledgeRecord(record);
      // Add the joined names
      if (record.client_id && clientsMap.has(record.client_id)) {
        transformed.clientName = clientsMap.get(record.client_id);
      }
      if (record.project_id && projectsMap.has(record.project_id)) {
        transformed.projectName = projectsMap.get(record.project_id);
      }
      return transformed;
    });
  } catch (error) {
    console.error('Error in getNotesKnowledgeByStatus:', error);
    return [];
  }
}

export async function getNotesKnowledgeByClient(clientId: number): Promise<NotesKnowledge[]> {
  try {
    const { data: notesKnowledge, error } = await supabase
      .from('notes_knowledge')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching notes knowledge by client:', error);
      throw error;
    }

    if (!notesKnowledge || notesKnowledge.length === 0) {
      return [];
    }

    // Get client and project names separately
    const clientIds = [...new Set(notesKnowledge.map(n => n.client_id).filter(Boolean))];
    const projectIds = [...new Set(notesKnowledge.map(n => n.project_id).filter(Boolean))];

    const [clientsData, projectsData] = await Promise.all([
      clientIds.length > 0 ? supabase.from('clients').select('id, name').in('id', clientIds) : { data: [] },
      projectIds.length > 0 ? supabase.from('projects').select('id, name').in('id', projectIds) : { data: [] }
    ]);

    const clientsMap = new Map((clientsData.data || []).map(c => [c.id, c.name]));
    const projectsMap = new Map((projectsData.data || []).map(p => [p.id, p.name]));

    return notesKnowledge.map(record => {
      const transformed = transformNotesKnowledgeRecord(record);
      // Add the joined names
      if (record.client_id && clientsMap.has(record.client_id)) {
        transformed.clientName = clientsMap.get(record.client_id);
      }
      if (record.project_id && projectsMap.has(record.project_id)) {
        transformed.projectName = projectsMap.get(record.project_id);
      }
      return transformed;
    });
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

    // Get client and project names separately
    const clientIds = [...new Set(notesKnowledge.map(n => n.client_id).filter(Boolean))];
    const projectIds = [...new Set(notesKnowledge.map(n => n.project_id).filter(Boolean))];

    const [clientsData, projectsData] = await Promise.all([
      clientIds.length > 0 ? supabase.from('clients').select('id, name').in('id', clientIds) : { data: [] },
      projectIds.length > 0 ? supabase.from('projects').select('id, name').in('id', projectIds) : { data: [] }
    ]);

    const clientsMap = new Map((clientsData.data || []).map(c => [c.id, c.name]));
    const projectsMap = new Map((projectsData.data || []).map(p => [p.id, p.name]));

    return notesKnowledge.map(record => {
      const transformed = transformNotesKnowledgeRecord(record);
      // Add the joined names
      if (record.client_id && clientsMap.has(record.client_id)) {
        transformed.clientName = clientsMap.get(record.client_id);
      }
      if (record.project_id && projectsMap.has(record.project_id)) {
        transformed.projectName = projectsMap.get(record.project_id);
      }
      return transformed;
    });
  } catch (error) {
    console.error('Error in getNotesKnowledgeByAuthor:', error);
    return [];
  }
}
