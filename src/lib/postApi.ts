import { supabase } from './supabase';

export interface DbPhoto {
  id: string;
  storage_path: string;
}

export interface DbPost {
  id: string;
  created_at: string;
  user_id: string;
  location_id: string;
  body: string;
  mapIds: string[];   // 紐づくマップID一覧（post_maps 経由）
  photos: DbPhoto[];
}

/** mapId に属する全投稿を取得（SECURITY DEFINER 関数経由） */
export async function getPosts(mapId: string): Promise<DbPost[]> {
  const { data, error } = await supabase.rpc('get_posts_for_map', { p_map_id: mapId });
  if (error) throw error;

  return (data ?? []).map((row: {
    id: string;
    created_at: string;
    user_id: string;
    location_id: string;
    body: string;
    map_ids: string[];
    photos: { id: string; storage_path: string }[];
  }) => ({
    id: row.id,
    created_at: row.created_at,
    user_id: row.user_id,
    location_id: row.location_id,
    body: row.body,
    mapIds: row.map_ids ?? [],
    photos: (row.photos ?? []).map(ph => ({ id: ph.id, storage_path: ph.storage_path })),
  }));
}

/** storage_path から signed URL を都度生成する（有効期限 1 時間） */
export async function getSignedUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('images')
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? null;
}

/**
 * テキスト投稿を複数マップに作成し、生成した post.id を返す。
 * create_post_with_maps RPC（SECURITY DEFINER）を使用。
 */
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

/**
 * 画像投稿を複数マップに作成（post → storage upload → post_photos）。
 * 生成した post.id を返す。
 */
export async function addImagePost(
  mapIds: string[],
  _userId: string,
  locationId: string,
  caption: string,
  files: File[],
): Promise<string> {
  const postId = crypto.randomUUID();

  // 1. posts + post_maps を SECURITY DEFINER 関数で作成
  const { error: postError } = await supabase.rpc('create_post_with_maps', {
    p_post_id:    postId,
    p_location_id: locationId,
    p_body:       caption,
    p_map_ids:    mapIds,
  });
  if (postError) throw postError;

  // 2. 各画像を storage にアップロード
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

  // 3. post_photos に insert
  if (photoInserts.length > 0) {
    const { error: photosError } = await supabase.from('post_photos').insert(photoInserts);
    if (photosError) throw photosError;
  }

  return postId;
}

/**
 * 特定のマップから投稿を外す。
 * 他のマップにも紐づいていない場合は投稿本体ごと削除し、
 * storage から画像を削除するためのパスを返す（フロントで削除する）。
 *
 * 戻り値: 削除した storage_path の配列（孤立しなかった場合は空配列）
 */
export async function removePostFromMap(postId: string, mapId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('remove_post_from_map', {
    p_post_id: postId,
    p_map_id:  mapId,
  });
  if (error) throw error;

  const paths = (data ?? []) as string[];

  // 孤立して投稿本体が削除された場合、storage の画像も削除する
  if (paths.length > 0) {
    await supabase.storage.from('images').remove(paths);
  }

  return paths;
}
