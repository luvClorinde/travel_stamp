import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useProfile(userId: string | undefined) {
  const [username, setUsername] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoadingProfile(true);
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    setUsername(data?.username ?? null);
    setLoadingProfile(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function updateUsername(newName: string) {
    if (!userId) throw new Error('未ログインです');
    const trimmed = newName.trim();
    if (!trimmed) throw new Error('ユーザー名を入力してください');
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, username: trimmed });
    if (error) throw error;
    setUsername(trimmed);
  }

  async function updateEmail(newEmail: string) {
    const trimmed = newEmail.trim();
    if (!trimmed) throw new Error('メールアドレスを入力してください');
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    if (error) throw error;
  }

  async function updatePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    if (newPassword !== confirmPassword) {
      throw new Error('新しいパスワードが一致しません');
    }
    if (newPassword.length < 6) {
      throw new Error('パスワードは6文字以上で入力してください');
    }

    // 現在のパスワードを signInWithPassword で確認
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new Error('ユーザー情報を取得できませんでした');

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInErr) throw new Error('現在のパスワードが正しくありません');

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  return { username, loadingProfile, updateUsername, updateEmail, updatePassword, refetchProfile: fetchProfile };
}
