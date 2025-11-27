// Product type definition - safe to import in client components
export interface Product {
  id: string;
  org_id: string;
  name: string;
  price: number;
  sku: string;
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
    org_id: record.org_id,
    name: record.name,
    price: parseFloat(record.price) || 0,
    sku: record.sku || '',
    status: record.status || 'active',
    category: record.category,
    stock: record.stock,
    rating: record.rating ? parseFloat(record.rating) : undefined,
    image_url: record.image_url,
    description: record.description,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

