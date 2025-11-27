import { cookies } from 'next/headers';
import { ProductsDataTable } from '@/components/products-data-table';
import { Product, transformProductRecord } from '@/lib/products';
import { AddProductButton } from '@/components/add-product-button';
import { createServerClient } from '@supabase/ssr';

interface ProductsPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

async function getAllProducts(orgId: string): Promise<Product[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    // Try to fetch from database first
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      // Return empty array if table doesn't exist yet
      return [];
    }

    if (data && data.length > 0) {
      return data.map(transformProductRecord);
    }

    // Return empty array if no products found
    return [];
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    return [];
  }
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { orgId } = await params;

  // Fetch products data
  const productsData = await getAllProducts(orgId);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-muted-foreground">
                Manage your retail products
              </p>
            </div>
            <AddProductButton orgId={orgId} />
          </div>
          <ProductsDataTable data={productsData} orgId={orgId} />
        </div>
      </div>
    </div>
  );
}

