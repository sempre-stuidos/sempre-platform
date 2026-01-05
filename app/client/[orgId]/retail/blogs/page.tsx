import { cookies } from 'next/headers';
import { Blog, transformBlogRecord } from '@/lib/blogs';
import { BlogManagement } from '@/components/blog-management/blog-management';
import { createServerClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { IconPlus } from '@tabler/icons-react';

interface BlogsPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

async function getAllBlogs(orgId: string): Promise<Blog[]> {
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
      .from('blogs')
      .select('*')
      .eq('business_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blogs:', error);
      // Return empty array if table doesn't exist yet
      return [];
    }

    if (data && data.length > 0) {
      return data.map(transformBlogRecord);
    }

    // Return empty array if no blogs found
    return [];
  } catch (error) {
    console.error('Error in getAllBlogs:', error);
    return [];
  }
}

export default async function BlogsPage({ params }: BlogsPageProps) {
  const { orgId } = await params;

  // Fetch blogs data
  const blogsData = await getAllBlogs(orgId);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Blog Posts</h1>
              <p className="text-muted-foreground">
                Create and manage your blog posts
              </p>
            </div>
            <Link href={`/client/${orgId}/retail/blogs/new`}>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Create New Blog
              </Button>
            </Link>
          </div>
          <BlogManagement blogs={blogsData} orgId={orgId} />
        </div>
      </div>
    </div>
  );
}

