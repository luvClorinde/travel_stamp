import { supabase } from '../lib/supabase';

export function useViewSettings(onUpdate: (mapId: string, enabled: boolean, token: string | null) => void) {

  async function enableView(mapId: string): Promise<string> {
    const { data, error } = await supabase.rpc('set_public_view', {
      p_map_id: mapId,
      p_enabled: true,
    });
    if (error) throw error;
    const token = data as string;
    onUpdate(mapId, true, token);
    return token;
  }

  async function disableView(mapId: string): Promise<void> {
    const { error } = await supabase.rpc('set_public_view', {
      p_map_id: mapId,
      p_enabled: false,
    });
    if (error) throw error;
    onUpdate(mapId, false, null);
  }

  async function regenerateToken(mapId: string): Promise<string> {
    const { data, error } = await supabase.rpc('regenerate_view_token', {
      p_map_id: mapId,
    });
    if (error) throw error;
    const token = data as string;
    onUpdate(mapId, true, token);
    return token;
  }

  return { enableView, disableView, regenerateToken };
}
