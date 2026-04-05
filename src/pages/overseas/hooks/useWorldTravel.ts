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

export function useWorldTravel(mapId: string) {
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
        console.error('useWorldTravel load error:', err);
        setLoading(false);
      });
  }, [mapId]);

  /**
   * 投稿を追加する。
   * @param extraMapIds 現在のマップ以外にも紐づけるマップIDの配列（省略時は現在のマップのみ）
   */
  const addRecord = useCallback(async (
    countryId: string,
    type: RecordType,
    content: string,
    _caption?: string,
    files?: File[],
    extraMapIds: string[] = [],
  ) => {
    const mapIds = [mapId, ...extraMapIds.filter(id => id !== mapId)];

    if (type === 'text') {
      const id = await addTextPost(mapIds, '', countryId, content);
      const record: TravelRecord = {
        id, type: 'text', content, createdAt: new Date().toISOString(), mapIds,
      };
      setData(prev => ({
        ...prev,
        [countryId]: [...(prev[countryId] ?? []), record],
      }));
    } else {
      if (!files || files.length === 0) return;
      const id = await addImagePost(mapIds, '', countryId, content, files);
      try {
        const posts = await getPosts(mapId);
        setData(buildTravelData(posts));
      } catch (fetchErr) {
        console.error('投稿後の再取得に失敗:', fetchErr);
        const record: TravelRecord = {
          id, type: 'image', content: '', caption: content || undefined,
          createdAt: new Date().toISOString(), mapIds,
        };
        setData(prev => ({
          ...prev,
          [countryId]: [...(prev[countryId] ?? []), record],
        }));
      }
    }
  }, [mapId]);

  /**
   * 現在のマップから投稿を外す。
   * 他マップにも紐づいていない場合は投稿本体ごと削除。
   */
  const deleteRecord = useCallback(async (countryId: string, recordId: string) => {
    await removePostFromMap(recordId, mapId);
    setData(prev => {
      const filtered = (prev[countryId] ?? []).filter(r => r.id !== recordId);
      const next = { ...prev };
      if (filtered.length === 0) {
        delete next[countryId];
      } else {
        next[countryId] = filtered;
      }
      return next;
    });
  }, [mapId]);

  const getRecords = useCallback((countryId: string): TravelRecord[] => {
    return data[countryId] ?? [];
  }, [data]);

  const isVisited = useCallback((countryId: string): boolean => {
    return (data[countryId]?.length ?? 0) > 0;
  }, [data]);

  const visitedCount = Object.values(data).filter(r => r.length > 0).length;

  return { addRecord, deleteRecord, getRecords, isVisited, visitedCount, loading };
}
