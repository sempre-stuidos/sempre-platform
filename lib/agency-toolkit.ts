import { supabase } from './supabase';
import { AgencyToolkit } from './types';

// Transform database record to match frontend interface
function transformAgencyToolkitRecord(record: Record<string, unknown>, invoices: Record<string, unknown>[], costHistory: Record<string, unknown>[]): AgencyToolkit {
  return {
    id: record.id as number,
    name: record.name as string,
    logo: (record.logo as string) || '',
    category: record.category as "Design" | "Hosting" | "AI" | "Marketing" | "Productivity",
    planType: record.plan_type as string,
    seats: record.seats as number,
    renewalCycle: record.renewal_cycle as "Monthly" | "Yearly",
    price: parseFloat(record.price as string),
    currency: record.currency as string,
    paymentMethod: record.payment_method as string,
    nextBillingDate: record.next_billing_date as string,
    status: record.status as "Active" | "Trial" | "Canceled",
    notes: (record.notes as string) || '',
    invoices: invoices.map(inv => ({
      id: inv.invoice_id as string,
      date: inv.date as string,
      amount: parseFloat(inv.amount as string),
      currency: inv.currency as string,
      status: inv.status as "Paid" | "Pending" | "Overdue"
    })),
    costHistory: costHistory.map(cost => ({
      date: cost.date as string,
      amount: parseFloat(cost.amount as string),
      currency: cost.currency as string
    })),
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}

// Transform frontend interface to database record format
function transformAgencyToolkitToRecord(agencyToolkit: Partial<AgencyToolkit>) {
  return {
    name: agencyToolkit.name,
    logo: agencyToolkit.logo,
    category: agencyToolkit.category,
    plan_type: agencyToolkit.planType,
    seats: agencyToolkit.seats,
    renewal_cycle: agencyToolkit.renewalCycle,
    price: agencyToolkit.price,
    currency: agencyToolkit.currency,
    payment_method: agencyToolkit.paymentMethod,
    next_billing_date: agencyToolkit.nextBillingDate,
    status: agencyToolkit.status,
    notes: agencyToolkit.notes,
  };
}

export async function getAllAgencyToolkit(): Promise<AgencyToolkit[]> {
  try {
    // Fetch agency toolkit
    const { data: agencyToolkit, error: agencyToolkitError } = await supabase
      .from('agency_toolkit')
      .select('*')
      .order('id', { ascending: true });

    if (agencyToolkitError) {
      console.error('Error fetching agency toolkit:', agencyToolkitError);
      throw agencyToolkitError;
    }

    if (!agencyToolkit || agencyToolkit.length === 0) {
      return [];
    }

    // Fetch all related data in parallel
    const toolkitRecords = agencyToolkit as Array<Record<string, unknown>>;
    const toolkitIds = toolkitRecords.map(toolkit => toolkit.id as number);
    
    const [
      { data: invoices },
      { data: costHistory }
    ] = await Promise.all([
      supabase.from('agency_toolkit_invoices').select('*').in('toolkit_id', toolkitIds),
      supabase.from('agency_toolkit_cost_history').select('*').in('toolkit_id', toolkitIds)
    ]);

    // Group related data by toolkit_id
    const invoicesByToolkit = (invoices || []).reduce((acc: Record<string, Record<string, unknown>[]>, invoice: Record<string, unknown>) => {
      const toolkitId = invoice.toolkit_id as string;
      if (!acc[toolkitId]) acc[toolkitId] = [];
      acc[toolkitId].push(invoice);
      return acc;
    }, {});

    const costHistoryByToolkit = (costHistory || []).reduce((acc: Record<string, Record<string, unknown>[]>, cost: Record<string, unknown>) => {
      const toolkitId = cost.toolkit_id as string;
      if (!acc[toolkitId]) acc[toolkitId] = [];
      acc[toolkitId].push(cost);
      return acc;
    }, {});

    return toolkitRecords.map(toolkit => {
      const toolkitId = toolkit.id as number;
      const toolkitKey = String(toolkitId);
      return transformAgencyToolkitRecord(
        toolkit,
        invoicesByToolkit[toolkitKey] || [],
        costHistoryByToolkit[toolkitKey] || []
      );
    });
  } catch (error) {
    console.error('Error in getAllAgencyToolkit:', error);
    return [];
  }
}

export async function getAgencyToolkitById(id: number): Promise<AgencyToolkit | null> {
  try {
    // Fetch agency toolkit
    const { data: agencyToolkit, error: agencyToolkitError } = await supabase
      .from('agency_toolkit')
      .select('*')
      .eq('id', id)
      .single();

    if (agencyToolkitError) {
      console.error('Error fetching agency toolkit:', agencyToolkitError);
      throw agencyToolkitError;
    }

    if (!agencyToolkit) {
      return null;
    }

    // Fetch all related data in parallel
    const [
      { data: invoices },
      { data: costHistory }
    ] = await Promise.all([
      supabase.from('agency_toolkit_invoices').select('*').eq('toolkit_id', id),
      supabase.from('agency_toolkit_cost_history').select('*').eq('toolkit_id', id)
    ]);

    return transformAgencyToolkitRecord(
      agencyToolkit,
      invoices || [],
      costHistory || []
    );
  } catch (error) {
    console.error('Error in getAgencyToolkitById:', error);
    return null;
  }
}

export async function createAgencyToolkit(agencyToolkit: Omit<AgencyToolkit, 'id' | 'created_at' | 'updated_at'>): Promise<AgencyToolkit | null> {
  try {
    const record = transformAgencyToolkitToRecord(agencyToolkit);
    
    // Validate that all required fields are present
    if (!record.name || !record.category || !record.plan_type || !record.renewal_cycle || 
        record.price === undefined || record.price === null || !record.payment_method || 
        !record.next_billing_date || !record.status) {
      console.error('Error creating agency toolkit: Missing required fields', {
        name: record.name,
        category: record.category,
        plan_type: record.plan_type,
        renewal_cycle: record.renewal_cycle,
        price: record.price,
        payment_method: record.payment_method,
        next_billing_date: record.next_billing_date,
        status: record.status,
      });
      throw new Error('Missing required fields for agency_toolkit insert');
    }

    // Insert agency toolkit
    const { data: newAgencyToolkit, error: agencyToolkitError } = await supabase
      .from('agency_toolkit')
      .insert([record])
      .select()
      .single();

    if (agencyToolkitError) {
      console.error('Error creating agency toolkit:', {
        message: agencyToolkitError.message,
        details: agencyToolkitError.details,
        hint: agencyToolkitError.hint,
        code: agencyToolkitError.code,
        record: record,
      });
      throw agencyToolkitError;
    }

    if (!newAgencyToolkit) {
      console.error('Error creating agency toolkit: No data returned from insert');
      return null;
    }

    const toolkitId = newAgencyToolkit.id;

    // Insert related data in parallel
    const insertPromises = [];

    if (agencyToolkit.invoices && agencyToolkit.invoices.length > 0) {
      const invoicesData = agencyToolkit.invoices.map(invoice => ({
        toolkit_id: toolkitId,
        invoice_id: invoice.id,
        date: invoice.date,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status
      }));
      insertPromises.push(
        supabase.from('agency_toolkit_invoices').insert(invoicesData)
      );
    }

    if (agencyToolkit.costHistory && agencyToolkit.costHistory.length > 0) {
      const costHistoryData = agencyToolkit.costHistory.map(cost => ({
        toolkit_id: toolkitId,
        date: cost.date,
        amount: cost.amount,
        currency: cost.currency
      }));
      insertPromises.push(
        supabase.from('agency_toolkit_cost_history').insert(costHistoryData)
      );
    }

    await Promise.all(insertPromises);

    // Return the complete agency toolkit with all related data
    return await getAgencyToolkitById(toolkitId);
  } catch (error) {
    console.error('Error in createAgencyToolkit:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function updateAgencyToolkit(id: number, updates: Partial<AgencyToolkit>): Promise<AgencyToolkit | null> {
  try {
    // Update agency toolkit
    const { error: agencyToolkitError } = await supabase
      .from('agency_toolkit')
      .update(transformAgencyToolkitToRecord(updates))
      .eq('id', id);

    if (agencyToolkitError) {
      console.error('Error updating agency toolkit:', agencyToolkitError);
      throw agencyToolkitError;
    }

    // Return the complete agency toolkit with all related data
    return await getAgencyToolkitById(id);
  } catch (error) {
    console.error('Error in updateAgencyToolkit:', error);
    return null;
  }
}

export async function deleteAgencyToolkit(id: number): Promise<boolean> {
  try {
    // Delete agency toolkit (cascading deletes will handle related data)
    const { error } = await supabase
      .from('agency_toolkit')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting agency toolkit:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteAgencyToolkit:', error);
    return false;
  }
}

export async function getAgencyToolkitByStatus(status: 'Active' | 'Trial' | 'Canceled'): Promise<AgencyToolkit[]> {
  try {
    const { data: agencyToolkit, error } = await supabase
      .from('agency_toolkit')
      .select('*')
      .eq('status', status)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching agency toolkit by status:', error);
      throw error;
    }

    if (!agencyToolkit || agencyToolkit.length === 0) {
      return [];
    }

    // For filtered results, we can return simplified data without all relations
    // or fetch full data if needed
    const toolkitRecords = agencyToolkit as Array<Record<string, unknown>>;
    return toolkitRecords.map(toolkit =>
      transformAgencyToolkitRecord(toolkit, [], [])
    );
  } catch (error) {
    console.error('Error in getAgencyToolkitByStatus:', error);
    return [];
  }
}

export async function getAgencyToolkitByCategory(category: AgencyToolkit['category']): Promise<AgencyToolkit[]> {
  try {
    const { data: agencyToolkit, error } = await supabase
      .from('agency_toolkit')
      .select('*')
      .eq('category', category)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching agency toolkit by category:', error);
      throw error;
    }

    if (!agencyToolkit || agencyToolkit.length === 0) {
      return [];
    }

    const toolkitRecords = agencyToolkit as Array<Record<string, unknown>>;
    return toolkitRecords.map(toolkit =>
      transformAgencyToolkitRecord(toolkit, [], [])
    );
  } catch (error) {
    console.error('Error in getAgencyToolkitByCategory:', error);
    return [];
  }
}
