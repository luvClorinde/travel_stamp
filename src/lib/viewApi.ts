import { supabase } from './supabase';

export interface ViewPhoto {
  id: string;
  storage_path: string;
}

export interface ViewPost {
  id: string;
  created_at: string;
  location_id: string;
  body: string;
  username: string | null;
  photos: ViewPhoto[];
  pinned_at: string | null;
}

export interface ViewData {
  map: { id: string; name: string; type: string };
  posts: ViewPost[];
}

export async function getPublicView(token: string): Promise<ViewData> {
  const { data, error } = await supabase.rpc('get_public_view', { p_token: token });
  if (error) throw error;
  if (!data) throw new Error('Not found');
  const result = typeof data === 'string' ? JSON.parse(data) : data;
  return {
    map: result.map,
    posts: (result.posts ?? []).map((p: ViewPost & { photos: unknown }) => ({
      ...p,
      photos: typeof p.photos === 'string' ? JSON.parse(p.photos) : (p.photos ?? []),
      pinned_at: p.pinned_at ?? null,
    })),
  };
}

export async function getSignedUrlAnon(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('images')
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? null;
}
