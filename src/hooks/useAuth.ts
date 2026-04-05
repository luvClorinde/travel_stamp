import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 既存セッションを確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  /**
   * アカウントを削除する。
   * Supabase 側に以下の SQL 関数が必要:
   *
   *   CREATE OR REPLACE FUNCTION delete_my_account()
   *   RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
   *   BEGIN
   *     DELETE FROM auth.users WHERE id = auth.uid();
   *   END;
   *   $$;
   */
  async function deleteAccount() {
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;
    // auth.users 削除後は onAuthStateChange が SIGNED_OUT を発火するが、
    // 念のため明示的にサインアウトする
    await supabase.auth.signOut();
  }

  return { user, loading, signIn, signUp, signOut, deleteAccount };
}
