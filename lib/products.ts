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

// Database record type from Supabase
interface ProductRecord {
  id: string | number;
  business_id?: string;
  org_id?: string;
  name: string;
  price?: number | string | null;
  sku?: string | null;
  status?: 'active' | 'out of stock' | 'closed for sale';
  category?: string | null;
  stock?: number | string | null;
  rating?: number | string | null;
  image_url?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Helper function to transform database record to Product
export function transformProductRecord(record: ProductRecord): Product {
  // business_id is required in the database, so it should always be present
  const orgId = record.business_id || record.org_id || '';
  if (!orgId) {
    throw new Error('Product record must have either business_id or org_id');
  }
  
  return {
    id: typeof record.id === 'string' ? record.id : record.id.toString(),
    org_id: orgId, // Map business_id to org_id for compatibility
    name: record.name,
    price: record.price !== null && record.price !== undefined 
      ? (typeof record.price === 'number' ? record.price : parseFloat(String(record.price)))
      : undefined,
    sku: record.sku || undefined,
    status: record.status || 'active',
    category: record.category || undefined,
    stock: record.stock !== null && record.stock !== undefined 
      ? (typeof record.stock === 'number' ? record.stock : parseInt(String(record.stock), 10)) 
      : undefined,
    rating: record.rating !== null && record.rating !== undefined 
      ? (typeof record.rating === 'number' ? record.rating : parseFloat(String(record.rating))) 
      : undefined,
    image_url: record.image_url || undefined,
    description: record.description || undefined,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

/**
 * Get products that have gallery images associated with them
 * Returns products with their image counts for retail businesses
 */
export async function getProductsWithGalleryImages(
  orgId: string
): Promise<Array<{ id: string; name: string; imageCount: number }>> {
  try {
    const { supabase } = await import('./supabase');
    
    // Query files_assets to get product IDs and counts
    const { data: filesData, error: filesError } = await supabase
      .from('files_assets')
      .select('product_id')
      .eq('type', 'Images')
      .eq('project', 'Gallery')
      .not('product_id', 'is', null);

    if (filesError) {
      console.error('Error fetching gallery images for products:', filesError);
      return [];
    }

    if (!filesData || filesData.length === 0) {
      return [];
    }

    // Count images per product
    const productCounts = new Map<string, number>();
    filesData.forEach((file) => {
      if (file.product_id) {
        const productId = file.product_id as string;
        productCounts.set(productId, (productCounts.get(productId) || 0) + 1);
      }
    });

    // Get unique product IDs
    const productIds = Array.from(productCounts.keys());

    if (productIds.length === 0) {
      return [];
    }

    // Fetch product details from retail_products_table
    const { data: productsData, error: productsError } = await supabase
      .from('retail_products_table')
      .select('id, name')
      .eq('business_id', orgId)
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return [];
    }

    if (!productsData || productsData.length === 0) {
      return [];
    }

    // Combine product data with image counts
    return productsData.map((product) => ({
      id: typeof product.id === 'string' ? product.id : product.id.toString(),
      name: product.name,
      imageCount: productCounts.get(product.id.toString()) || 0,
    }));
  } catch (error) {
    console.error('Error in getProductsWithGalleryImages:', error);
    return [];
  }
}

