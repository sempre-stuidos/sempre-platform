import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOrganizationById } from '@/lib/businesses';
import { getGalleryImages } from '@/lib/gallery';
import { supabaseAdmin } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { GalleryWrapper } from '@/components/gallery-wrapper';
import { GalleryViewToggle } from '@/components/gallery-view-toggle';

interface GalleryPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { orgId } = await params;
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

  const organization = await getOrganizationById(orgId, supabaseAdmin);
  
  // Get client linked to this organization
  let clientId: number | null = null;
  if (organization) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1)
      .single();
    
    if (clients) {
      clientId = clients.id;
    }
  }

  const galleryImages = clientId ? await getGalleryImages(clientId, supabase) : [];

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Manage your restaurant gallery images.
            </p>
          </div>
          {clientId && (
            <div className="flex items-center gap-2">
              <GalleryViewToggle />
              <Link href={`/client/${orgId}/restaurant/gallery/new`}>
                <Button>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Image
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="px-4 lg:px-6">
          {clientId ? (
            <GalleryWrapper orgId={orgId} clientId={clientId} initialImages={galleryImages} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Client Linked</CardTitle>
                <CardDescription>
                  This organization is not linked to a client yet. Please contact an administrator.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

