import { supabase } from './supabase';
import { AgencyToolkit, Invoice, CostHistory } from './types';

// Transform database record to match frontend interface
function transformAgencyToolkitRecord(record: any, invoices: any[], costHistory: any[]): AgencyToolkit {
  return {
    id: record.id,
    name: record.name,
    logo: record.logo || '',
    category: record.category,
    planType: record.plan_type,
    seats: record.seats,
    renewalCycle: record.renewal_cycle,
    price: parseFloat(record.price),
    currency: record.currency,
    paymentMethod: record.payment_method,
    nextBillingDate: record.next_billing_date,
    status: record.status,
    notes: record.notes || '',
    invoices: invoices.map(inv => ({
      id: inv.invoice_id,
      date: inv.date,
      amount: parseFloat(inv.amount),
      currency: inv.currency,
      status: inv.status
    })),
    costHistory: costHistory.map(cost => ({
      date: cost.date,
      amount: parseFloat(cost.amount),
      currency: cost.currency
    })),
    created_at: record.created_at,
    updated_at: record.updated_at,
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
    const toolkitIds = agencyToolkit.map(at => at.id);
    
    const [
      { data: invoices },
      { data: costHistory }
    ] = await Promise.all([
      supabase.from('agency_toolkit_invoices').select('*').in('toolkit_id', toolkitIds),
      supabase.from('agency_toolkit_cost_history').select('*').in('toolkit_id', toolkitIds)
    ]);

    // Group related data by toolkit_id
    const invoicesByToolkit = (invoices || []).reduce((acc: any, invoice: any) => {
      if (!acc[invoice.toolkit_id]) acc[invoice.toolkit_id] = [];
      acc[invoice.toolkit_id].push(invoice);
      return acc;
    }, {});

    const costHistoryByToolkit = (costHistory || []).reduce((acc: any, cost: any) => {
      if (!acc[cost.toolkit_id]) acc[cost.toolkit_id] = [];
      acc[cost.toolkit_id].push(cost);
      return acc;
    }, {});

    return agencyToolkit.map(toolkit => 
      transformAgencyToolkitRecord(
        toolkit,
        invoicesByToolkit[toolkit.id] || [],
        costHistoryByToolkit[toolkit.id] || []
      )
    );
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
    // Insert agency toolkit
    const { data: newAgencyToolkit, error: agencyToolkitError } = await supabase
      .from('agency_toolkit')
      .insert([transformAgencyToolkitToRecord(agencyToolkit)])
      .select()
      .single();

    if (agencyToolkitError) {
      console.error('Error creating agency toolkit:', agencyToolkitError);
      throw agencyToolkitError;
    }

    if (!newAgencyToolkit) {
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
    console.error('Error in createAgencyToolkit:', error);
    return null;
  }
}

export async function updateAgencyToolkit(id: number, updates: Partial<AgencyToolkit>): Promise<AgencyToolkit | null> {
  try {
    // Update agency toolkit
    const { data: updatedAgencyToolkit, error: agencyToolkitError } = await supabase
      .from('agency_toolkit')
      .update(transformAgencyToolkitToRecord(updates))
      .eq('id', id)
      .select()
      .single();

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
    return agencyToolkit.map(toolkit => 
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

    return agencyToolkit.map(toolkit => 
      transformAgencyToolkitRecord(toolkit, [], [])
    );
  } catch (error) {
    console.error('Error in getAgencyToolkitByCategory:', error);
    return [];
  }
}
