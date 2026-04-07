import { useState, useEffect, useCallback } from 'react';
import type { TravelData, TravelRecord, RecordType } from '../../../types';
import type { DbPost } from '../../../lib/postApi';
import { getPosts, addTextPost, addImagePost, removePostFromMap, pinPost, unpinPost } from '../../../lib/postApi';

function dbPostToRecord(post: DbPost): TravelRecord {
  const hasPhotos = post.photos.length > 0;
  return {
    id: post.id,
    type: hasPhotos ? 'image' : 'text',
    content: hasPhotos ? '' : post.body,
    caption: hasPhotos ? (post.body || undefined) : undefined,
    photoDetails: hasPhotos
      ? post.photos.map(p => ({ id: p.id, storagePath: p.storage_path }))
      : undefined,
    createdAt: post.created_at,
    mapIds: post.mapIds,
    authorId: post.author_id,
    pinnedAt: post.pinned_at,
  };
}

function sortRecords(records: TravelRecord[]): TravelRecord[] {
  return [...records].sort((a, b) => {
    if (a.pinnedAt && b.pinnedAt) return a.pinnedAt.localeCompare(b.pinnedAt); // ピン留め順
    if (a.pinnedAt) return -1;
    if (b.pinnedAt) return 1;
    return b.createdAt.localeCompare(a.createdAt); // 新しい順
  });
}

function buildTravelData(posts: DbPost[]): TravelData {
  const data: TravelData = {};
  for (const post of posts) {
    const loc = post.location_id;
    if (!data[loc]) data[loc] = [];
    data[loc].push(dbPostToRecord(post));
  }
  for (const loc in data) data[loc] = sortRecords(data[loc]);
  return data;
}

export function useTravel(mapId: string) {
  const [data, setData] = useState<TravelData>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!mapId) return;
    const posts = await getPosts(mapId);
    setData(buildTravelData(posts));
  }, [mapId]);

  useEffect(() => {
    if (!mapId) return;
    setLoading(true);
    setLoadError(null);
    fetchPosts()
      .then(() => setLoading(false))
      .catch(err => {
        console.error('useTravel load error:', err);
        setLoadError(err?.message ?? String(err));
        setLoading(false);
      });
  }, [mapId, fetchPosts]);

  const reloadPosts = useCallback(async () => {
    try { await fetchPosts(); } catch (err) { console.error('reload error:', err); }
  }, [fetchPosts]);

  const addRecord = useCallback(async (
    locationId: string,
    type: RecordType,
    content: string,
    _caption?: string,
    files?: File[],
    extraMapIds: string[] = [],
  ) => {
    const mapIds = [mapId, ...extraMapIds.filter(id => id !== mapId)];

    if (type === 'text') {
      const id = await addTextPost(mapIds, '', locationId, content);
      const record: TravelRecord = {
        id, type: 'text', content, createdAt: new Date().toISOString(), mapIds, authorId: '', pinnedAt: null,
      };
      setData(prev => ({
        ...prev,
        [locationId]: [record, ...(prev[locationId] ?? [])],
      }));
    } else {
      if (!files || files.length === 0) return;
      await addImagePost(mapIds, '', locationId, content, files);
      try {
        await fetchPosts();
      } catch (fetchErr) {
        console.error('投稿後の再取得に失敗:', fetchErr);
        const record: TravelRecord = {
          id: crypto.randomUUID(), type: 'image', content: '',
          caption: content || undefined, createdAt: new Date().toISOString(), mapIds, authorId: '', pinnedAt: null,
        };
        setData(prev => ({
          ...prev,
          [locationId]: [record, ...(prev[locationId] ?? [])],
        }));
      }
    }
  }, [mapId, fetchPosts]);

  const pinRecord = useCallback(async (locationId: string, recordId: string) => {
    await pinPost(mapId, recordId);
    setData(prev => {
      const records = prev[locationId] ?? [];
      const pinnedAt = new Date().toISOString();
      const updated = records.map(r => r.id === recordId ? { ...r, pinnedAt } : r);
      return { ...prev, [locationId]: sortRecords(updated) };
    });
  }, [mapId]);

  const unpinRecord = useCallback(async (locationId: string, recordId: string) => {
    await unpinPost(mapId, recordId);
    setData(prev => {
      const records = prev[locationId] ?? [];
      const updated = records.map(r => r.id === recordId ? { ...r, pinnedAt: null } : r);
      return { ...prev, [locationId]: sortRecords(updated) };
    });
  }, [mapId]);

  const deleteRecord = useCallback(async (locationId: string, recordId: string) => {
    await removePostFromMap(recordId, mapId);
    setData(prev => {
      const filtered = (prev[locationId] ?? []).filter(r => r.id !== recordId);
      const next = { ...prev };
      if (filtered.length === 0) delete next[locationId];
      else next[locationId] = filtered;
      return next;
    });
  }, [mapId]);

  const getRecords = useCallback((locationId: string): TravelRecord[] => {
    return data[locationId] ?? [];
  }, [data]);

  const isVisited = useCallback((locationId: string): boolean => {
    return (data[locationId]?.length ?? 0) > 0;
  }, [data]);

  const visitedCount = Object.values(data).filter(r => r.length > 0).length;

  return { addRecord, deleteRecord, pinRecord, unpinRecord, getRecords, isVisited, visitedCount, loading, loadError, reloadPosts, data };
}
