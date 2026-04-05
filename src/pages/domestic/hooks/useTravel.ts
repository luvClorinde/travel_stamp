import { useState, useEffect, useCallback } from 'react';
import type { TravelData, TravelRecord, RecordType } from '../../../types';
import type { DbPost } from '../../../lib/postApi';
import { getPosts, addTextPost, addImagePost, removePostFromMap } from '../../../lib/postApi';

function dbPostToRecord(post: DbPost): TravelRecord {
  const hasPhotos = post.photos.length > 0;
  return {
    id: post.id,
    type: hasPhotos ? 'image' : 'text',
    content: hasPhotos ? '' : post.body,
    caption: hasPhotos ? (post.body || undefined) : undefined,
    photos: hasPhotos ? post.photos.map(p => p.storage_path) : undefined,
    createdAt: post.created_at,
    mapIds: post.mapIds,
  };
}

function buildTravelData(posts: DbPost[]): TravelData {
  const data: TravelData = {};
  for (const post of posts) {
    const loc = post.location_id;
    if (!data[loc]) data[loc] = [];
    data[loc].push(dbPostToRecord(post));
  }
  return data;
}

export function useTravel(mapId: string) {
  const [data, setData] = useState<TravelData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapId) return;
    setLoading(true);
    getPosts(mapId)
      .then(posts => {
        setData(buildTravelData(posts));
        setLoading(false);
      })
      .catch(err => {
        console.error('useTravel load error:', err);
        setLoading(false);
      });
  }, [mapId]);

  /**
   * 投稿を追加する。
   * @param extraMapIds 現在のマップ以外にも紐づけるマップIDの配列（省略時は現在のマップのみ）
   */
  const addRecord = useCallback(async (
    locationId: string,
    type: RecordType,
    content: string,
    _caption?: string,
    files?: File[],
    extraMapIds: string[] = [],
  ) => {
    // 重複を除いたマップID一覧（現在のマップを先頭に）
    const mapIds = [mapId, ...extraMapIds.filter(id => id !== mapId)];

    if (type === 'text') {
      const id = await addTextPost(mapIds, '', locationId, content);
      const record: TravelRecord = {
        id, type: 'text', content, createdAt: new Date().toISOString(), mapIds,
      };
      setData(prev => ({
        ...prev,
        [locationId]: [...(prev[locationId] ?? []), record],
      }));
    } else {
      if (!files || files.length === 0) return;
      // content に画像のキャプションが入っている（caption 引数は unused）
      const id = await addImagePost(mapIds, '', locationId, content, files);
      // アップロード後に storage_path 付きの最新データを再取得（失敗してもオプティミスティックに表示）
      try {
        const posts = await getPosts(mapId);
        setData(buildTravelData(posts));
      } catch (fetchErr) {
        console.error('投稿後の再取得に失敗:', fetchErr);
        // 再取得失敗時は storage_path なしでとりあえず一覧に追加
        const record: TravelRecord = {
          id, type: 'image', content: '', caption: content || undefined,
          createdAt: new Date().toISOString(), mapIds,
        };
        setData(prev => ({
          ...prev,
          [locationId]: [...(prev[locationId] ?? []), record],
        }));
      }
    }
  }, [mapId]);

  /**
   * 現在のマップから投稿を外す。
   * 他マップにも紐づいていない場合は投稿本体ごと削除。
   */
  const deleteRecord = useCallback(async (locationId: string, recordId: string) => {
    await removePostFromMap(recordId, mapId);
    setData(prev => {
      const filtered = (prev[locationId] ?? []).filter(r => r.id !== recordId);
      const next = { ...prev };
      if (filtered.length === 0) {
        delete next[locationId];
      } else {
        next[locationId] = filtered;
      }
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

  return { addRecord, deleteRecord, getRecords, isVisited, visitedCount, loading };
}
