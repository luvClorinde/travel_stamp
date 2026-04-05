import { useState } from 'react';

type AuthMode = 'sign-in' | 'sign-up';

interface Props {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, username: string) => Promise<void>;
}

export function LoginPage({ onSignIn, onSignUp }: Props) {
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function switchToSignIn() {
    setMode('sign-in');
    setEmail('');
    setEmailConfirm('');
    setPassword('');
    setUsername('');
    setError('');
    setSuccess('');
  }

  function toggleMode() {
    if (mode === 'sign-in') {
      setMode('sign-up');
    } else {
      switchToSignIn();
    }
    setError('');
    setSuccess('');
  }

  async function handleSubmit() {
    if (!email.trim() || !password) return;
    setError('');
    setSuccess('');

    if (mode === 'sign-up') {
      if (!username.trim()) {
        setError('ユーザー名を入力してください。');
        return;
      }
      if (email.trim() !== emailConfirm.trim()) {
        setError('メールアドレスが一致していません。もう一度確認してください。');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'sign-in') {
        await onSignIn(email.trim(), password);
      } else {
        await onSignUp(email.trim(), password, username.trim());
        setEmail('');
        setEmailConfirm('');
        setPassword('');
        setUsername('');
        setSuccess('アカウントを作成しました。そのままログインしてください。');
        setMode('sign-in');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (mode === 'sign-up') {
        if (msg.includes('User already registered') || msg.includes('already been registered') || msg.includes('already registered')) {
          setError('このメールアドレスはすでに登録されています。ログインしてください。');
        } else if (msg.includes('Password should be at least')) {
          setError('パスワードは6文字以上で入力してください。');
        } else if (msg.includes('Invalid email')) {
          setError('メールアドレスの形式が正しくありません。');
        } else {
          setError(msg || 'アカウント作成に失敗しました。');
        }
      } else {
        if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
          setError('メールアドレスまたはパスワードが正しくありません。');
        } else if (msg.includes('Email not confirmed')) {
          setError('メールアドレスの確認が完了していません。届いたメールを確認してください。');
        } else {
          setError(msg || 'ログインに失敗しました。');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    mode === 'sign-in'
      ? email.trim() !== '' && password !== '' && !loading
      : email.trim() !== '' && emailConfirm.trim() !== '' && password !== '' && username.trim() !== '' && !loading;

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="app-title" style={{ textAlign: 'center' }}>旅行スタンプ帳</h1>
        <p className="app-subtitle" style={{ textAlign: 'center' }}>
          {mode === 'sign-in' ? 'ログインして旅を記録しよう' : '新しいアカウントを作成'}
        </p>

        {success && (
          <p style={{
            fontSize: 13, color: '#16a34a', background: '#f0fdf4',
            border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px',
            margin: 0, textAlign: 'center',
          }}>
            {success}
          </p>
        )}

        <div className="login-form">
          {mode === 'sign-up' && (
            <input
              className="form-input"
              type="text"
              placeholder="ユーザー名"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              autoFocus
            />
          )}

          <input
            className="form-input"
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            autoFocus={mode === 'sign-in'}
          />

          {mode === 'sign-up' && (
            <input
              className="form-input"
              type="email"
              placeholder="メールアドレス（確認）"
              value={emailConfirm}
              onChange={e => { setEmailConfirm(e.target.value); setError(''); }}
            />
          )}

          <input
            className="form-input"
            type="password"
            placeholder="パスワード（6文字以上）"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />

          {error && (
            <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{error}</p>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {loading ? '処理中...' : mode === 'sign-in' ? 'ログイン' : 'アカウント作成'}
          </button>
        </div>

        <div className="login-existing">
          <button className="login-user-btn" onClick={toggleMode}>
            {mode === 'sign-in'
              ? 'アカウントをお持ちでない方はこちら →'
              : 'すでにアカウントをお持ちの方はこちら →'}
          </button>
        </div>
      </div>
    </div>
  );
}
