// Product type definition - safe to import in client components
export interface Product {
  id: string;
  org_id: string; // Keep org_id for compatibility, but map from business_id
  name: string;
  price?: number;
  sku?: string;
  status: 'active' | 'out of stock' | 'closed for sale';
  category?: string;
  stock?: number;
  rating?: number;
  image_url?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Helper function to transform database record to Product
export function transformProductRecord(record: any): Product {
  return {
    id: typeof record.id === 'string' ? record.id : record.id.toString(),
    org_id: record.business_id || record.org_id, // Map business_id to org_id for compatibility
    name: record.name,
    price: record.price !== null && record.price !== undefined ? parseFloat(record.price) : undefined,
    sku: record.sku || undefined,
    status: record.status || 'active',
    category: record.category || undefined,
    stock: record.stock !== null && record.stock !== undefined ? parseInt(record.stock) : undefined,
    rating: record.rating !== null && record.rating !== undefined ? parseFloat(record.rating) : undefined,
    image_url: record.image_url || undefined,
    description: record.description || undefined,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

