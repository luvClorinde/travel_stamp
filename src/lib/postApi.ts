import { supabase } from './supabase';

export interface DbPhoto {
  id: string;
  storage_path: string;
}

export interface DbPost {
  id: string;
  created_at: string;
  author_id: string;
  location_id: string;
  body: string;
  mapIds: string[];
  photos: DbPhoto[];
}

/** mapId に属する全投稿を取得（SECURITY DEFINER 関数経由） */
export async function getPosts(mapId: string): Promise<DbPost[]> {
  const { data, error } = await supabase.rpc('get_posts_for_map', { p_map_id: mapId });
  if (error) throw error;

  return (data ?? []).map((row: {
    id: string;
    created_at: string;
    author_id: unknown;
    location_id: string;
    body: string;
    map_ids: unknown;
    photos: unknown;
  }) => {
    const rawPhotos = typeof row.photos === 'string'
      ? (JSON.parse(row.photos) as { id: string; storage_path: string }[])
      : Array.isArray(row.photos)
        ? (row.photos as { id: string; storage_path: string }[])
        : [];

    const rawMapIds = Array.isArray(row.map_ids)
      ? (row.map_ids as string[])
      : typeof row.map_ids === 'string'
        ? (JSON.parse(row.map_ids) as string[])
        : [];

    return {
      id: row.id,
      created_at: row.created_at,
      author_id: typeof row.author_id === 'string' ? row.author_id : '',
      location_id: row.location_id,
      body: row.body,
      mapIds: rawMapIds,
      photos: rawPhotos.map(ph => ({ id: ph.id, storage_path: ph.storage_path })),
    };
  });
}

/** storage_path から signed URL を都度生成する（有効期限 1 時間） */
export async function getSignedUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('images')
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? null;
}

/** テキスト投稿を複数マップに作成し、生成した post.id を返す */
export async function addTextPost(
  mapIds: string[],
  _userId: string,
  locationId: string,
  body: string,
): Promise<string> {
  const postId = crypto.randomUUID();
  const { error } = await supabase.rpc('create_post_with_maps', {
    p_post_id:    postId,
    p_location_id: locationId,
    p_body:       body,
    p_map_ids:    mapIds,
  });
  if (error) throw error;
  return postId;
}

/** 画像投稿を複数マップに作成（post → storage upload → post_photos）*/
export async function addImagePost(
  mapIds: string[],
  _userId: string,
  locationId: string,
  caption: string,
  files: File[],
): Promise<string> {
  const postId = crypto.randomUUID();

  const { error: postError } = await supabase.rpc('create_post_with_maps', {
    p_post_id:    postId,
    p_location_id: locationId,
    p_body:       caption,
    p_map_ids:    mapIds,
  });
  if (postError) throw postError;

  const photoInserts: { post_id: string; storage_path: string }[] = [];
  for (const file of files) {
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;
    const storagePath = `${postId}/${filename}`;
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(storagePath, file);
    if (uploadError) throw uploadError;
    photoInserts.push({ post_id: postId, storage_path: storagePath });
  }

  if (photoInserts.length > 0) {
    const { error: photosError } = await supabase.from('post_photos').insert(photoInserts);
    if (photosError) throw photosError;
  }

  return postId;
}

/** 特定のマップから投稿を外す。孤立した場合は投稿本体ごと削除 */
export async function removePostFromMap(postId: string, mapId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('remove_post_from_map', {
    p_post_id: postId,
    p_map_id:  mapId,
  });
  if (error) throw error;

  const paths = (data ?? []) as string[];
  if (paths.length > 0) {
    await supabase.storage.from('images').remove(paths);
  }
  return paths;
}

// ─── 編集系 API ────────────────────────────────────────────

/** 投稿本文を更新（作成者のみ） */
export async function updatePostBody(postId: string, body: string): Promise<void> {
  const { error } = await supabase.rpc('update_post_body', {
    p_post_id: postId,
    p_body:    body,
  });
  if (error) throw error;
}

/** 写真を削除（DB から削除し storage_path を返す → Storage も削除） */
export async function deletePhoto(photoId: string): Promise<void> {
  const { data, error } = await supabase.rpc('delete_photo_from_post', {
    p_photo_id: photoId,
  });
  if (error) throw error;
  const storagePath = data as string | null;
  if (storagePath) {
    await supabase.storage.from('images').remove([storagePath]);
  }
}

/** 既存の post に画像を追加 */
export async function addPhotosToPost(postId: string, files: File[]): Promise<void> {
  const inserts: { post_id: string; storage_path: string }[] = [];
  for (const file of files) {
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;
    const storagePath = `${postId}/${filename}`;
    const { error } = await supabase.storage.from('images').upload(storagePath, file);
    if (error) throw error;
    inserts.push({ post_id: postId, storage_path: storagePath });
  }
  if (inserts.length > 0) {
    const { error } = await supabase.from('post_photos').insert(inserts);
    if (error) throw error;
  }
}

/** 写真のキャプションを更新 */
export async function updatePhotoCaption(photoId: string, caption: string): Promise<void> {
  const { error } = await supabase.rpc('update_photo_caption', {
    p_photo_id: photoId,
    p_caption:  caption,
  });
  if (error) throw error;
}

/** 投稿の紐づきマップを更新（最低1件必須） */
export async function updatePostMaps(postId: string, mapIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('update_post_maps', {
    p_post_id: postId,
    p_map_ids: mapIds,
  });
  if (error) throw error;
}
