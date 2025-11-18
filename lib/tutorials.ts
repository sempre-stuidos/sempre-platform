import type { SupabaseClient } from '@supabase/supabase-js';

export interface TutorialStep {
  stepNumber: number;
  title: string;
  description: string;
  content: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: 'Events' | 'Menu';
  icon: string;
  estimated_time: string;
  content: {
    steps: TutorialStep[];
  };
  created_at: string;
  updated_at: string;
}

/**
 * Transform database record to Tutorial interface
 */
function transformTutorialRecord(record: Record<string, unknown>): Tutorial {
  return {
    id: record.id as string,
    title: record.title as string,
    description: record.description as string,
    category: record.category as 'Events' | 'Menu',
    icon: record.icon as string,
    estimated_time: record.estimated_time as string,
    content: record.content as { steps: TutorialStep[] },
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}

/**
 * Get all tutorials from Supabase
 */
export async function getTutorials(
  supabaseClient: SupabaseClient
): Promise<{ tutorials: Tutorial[]; error: Error | null }> {
  try {
    const { data, error } = await supabaseClient
      .from('tutorials')
      .select('*')
      .order('category', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tutorials:', error);
      return { tutorials: [], error: new Error(error.message) };
    }

    return { tutorials: (data || []).map(transformTutorialRecord), error: null };
  } catch (error) {
    console.error('Error in getTutorials:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { tutorials: [], error: new Error(errorMessage) };
  }
}

/**
 * Get tutorial by ID from Supabase
 */
export async function getTutorialById(
  tutorialId: string,
  supabaseClient: SupabaseClient
): Promise<Tutorial | null> {
  try {
    const { data, error } = await supabaseClient
      .from('tutorials')
      .select('*')
      .eq('id', tutorialId)
      .single();

    if (error) {
      console.error('Error fetching tutorial:', error);
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    return transformTutorialRecord(data);
  } catch (error) {
    console.error('Error in getTutorialById:', error);
    return null;
  }
}

/**
 * Get tutorials by category from Supabase
 */
export async function getTutorialsByCategory(
  category: 'Events' | 'Menu',
  supabaseClient: SupabaseClient
): Promise<Tutorial[]> {
  try {
    const { data, error } = await supabaseClient
      .from('tutorials')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tutorials by category:', error);
      throw error;
    }

    return (data || []).map(transformTutorialRecord);
  } catch (error) {
    console.error('Error in getTutorialsByCategory:', error);
    return [];
  }
}

