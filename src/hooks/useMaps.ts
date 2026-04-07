import { useState, useEffect, useCallback } from 'react';
import type { MapMeta } from '../types';
import { supabase } from '../lib/supabase';

function generateShareId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function rowToMapMeta(m: { id: string; name: string; share_id: string; type: string; created_at: string; public_view_enabled?: boolean; view_token?: string | null }): MapMeta {
  return {
    id: m.id,
    shareId: m.share_id,
    name: m.name,
    type: (m.type ?? 'domestic') as 'domestic' | 'international',
    createdAt: m.created_at,
    viewEnabled: m.public_view_enabled ?? false,
    viewToken: m.view_token ?? null,
  };
}

/** share_id からマップ情報を取得（join フォームのプレビュー用） */
export async function getMapByShareId(
  shareId: string,
): Promise<{ name: string; type: 'domestic' | 'international' } | null> {
  const { data } = await supabase
    .from('maps')
    .select('name, type')
    .eq('share_id', shareId.trim().toUpperCase())
    .maybeSingle();
  if (!data) return null;
  return { name: data.name, type: data.type as 'domestic' | 'international' };
}

export function useMaps(userId: string) {
  const [maps, setMaps] = useState<MapMeta[]>([]);
  const [loading, setLoading] = useState(false);

  // get_my_maps RPC で取得（SELECT RLS を回避）
  async function fetchMaps() {
    const { data, error } = await supabase.rpc('get_my_maps');
    if (error) {
      console.error('get_my_maps error:', error);
      return;
    }
    setMaps((data ?? []).map(rowToMapMeta));
  }

  useEffect(() => {
    if (!userId) {
      setMaps([]);
      return;
    }
    setLoading(true);
    fetchMaps().finally(() => setLoading(false));
  }, [userId]);

  // create_map_with_member RPC でマップ作成＋メンバー追加をアトミックに実行
  const createMap = useCallback(async (name: string, type: 'domestic' | 'international' = 'domestic') => {
    if (!userId) return;
    const mapId = crypto.randomUUID();
    const shareId = generateShareId();
    const createdAt = new Date().toISOString();

    const { error } = await supabase.rpc('create_map_with_member', {
      p_id: mapId,
      p_name: name.trim(),
      p_share_id: shareId,
      p_type: type,
    });

    if (error) {
      console.error('create_map_with_member error:', error);
      throw new Error(`地図の作成に失敗しました: ${error.message}`);
    }

    setMaps(prev => [
      ...prev,
      { id: mapId, shareId, name: name.trim(), type, createdAt, viewEnabled: false, viewToken: null },
    ]);
  }, [userId]);

  // shareId のみで参加（join_map_safe RPC で RLS を回避しつつ map_members に追加）
  const joinMap = useCallback(async (shareId: string) => {
    if (!userId) return;
    const trimmedId = shareId.trim().toUpperCase();

    const { data, error } = await supabase.rpc('join_map_safe', { p_share_id: trimmedId });
    if (error) {
      console.error('joinMap error:', error);
      throw new Error(error.message);
    }

    // RPC が返した行を直接 state に追加（fetchMaps を省略して即時反映）
    const rows = data as { id: string; name: string; share_id: string; type: string; created_at: string }[] | null;
    if (rows && rows.length > 0) {
      const joined = rowToMapMeta(rows[0]);
      setMaps(prev => prev.some(m => m.id === joined.id) ? prev : [...prev, joined]);
    } else {
      // RPC が行を返さない実装の場合は再取得にフォールバック
      await fetchMaps();
    }
  }, [userId]);

  const deleteMap = useCallback(async (id: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from('map_members')
      .delete()
      .eq('map_id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('deleteMap error:', error);
      throw error;
    }
    setMaps(prev => prev.filter(m => m.id !== id));
  }, [userId]);

  // 閲覧モードの state を更新（useViewSettings から呼ばれる）
  const updateMapView = useCallback((mapId: string, viewEnabled: boolean, viewToken: string | null) => {
    setMaps(prev => prev.map(m =>
      m.id === mapId ? { ...m, viewEnabled, viewToken } : m
    ));
  }, []);

  return { maps, createMap, joinMap, deleteMap, updateMapView, loading };
}
