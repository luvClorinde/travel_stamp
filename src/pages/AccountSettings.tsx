import { useState } from 'react';

interface Props {
  currentEmail: string;
  currentUsername: string;
  onUpdateUsername: (name: string) => Promise<void>;
  onUpdateEmail: (email: string) => Promise<void>;
  onUpdatePassword: (current: string, next: string, confirm: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onClose: () => void;
}

type Section = 'username' | 'email' | 'password';

interface SectionState {
  loading: boolean;
  success: string;
  error: string;
}

function useSectionState(): [SectionState, (patch: Partial<SectionState>) => void, () => void] {
  const [state, setState] = useState<SectionState>({ loading: false, success: '', error: '' });
  const set = (patch: Partial<SectionState>) => setState(prev => ({ ...prev, ...patch }));
  const reset = () => setState({ loading: false, success: '', error: '' });
  return [state, set, reset];
}

export function AccountSettings({
  currentEmail,
  currentUsername,
  onUpdateUsername,
  onUpdateEmail,
  onUpdatePassword,
  onDeleteAccount,
  onClose,
}: Props) {
  const [openSection, setOpenSection] = useState<Section | null>(null);

  // ユーザー名
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [usernameState, setUsernameState, resetUsername] = useSectionState();

  // メールアドレス
  const [newEmail, setNewEmail] = useState('');
  const [emailState, setEmailState, resetEmail] = useSectionState();

  // パスワード
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwState, setPwState, resetPw] = useSectionState();

  function toggleSection(s: Section) {
    if (openSection === s) {
      setOpenSection(null);
    } else {
      setOpenSection(s);
      resetUsername();
      resetEmail();
      resetPw();
    }
  }

  async function handleUpdateUsername() {
    setUsernameState({ loading: true, error: '', success: '' });
    try {
      await onUpdateUsername(newUsername);
      setUsernameState({ loading: false, success: 'ユーザー名を更新しました', error: '' });
    } catch (e: unknown) {
      setUsernameState({ loading: false, error: e instanceof Error ? e.message : '更新に失敗しました', success: '' });
    }
  }

  async function handleUpdateEmail() {
    setEmailState({ loading: true, error: '', success: '' });
    try {
      await onUpdateEmail(newEmail);
      setEmailState({ loading: false, success: 'メールアドレスを変更しました', error: '' });
      setNewEmail('');
    } catch (e: unknown) {
      setEmailState({ loading: false, error: e instanceof Error ? e.message : '更新に失敗しました', success: '' });
    }
  }

  async function handleUpdatePassword() {
    setPwState({ loading: true, error: '', success: '' });
    try {
      await onUpdatePassword(currentPw, newPw, confirmPw);
      setPwState({ loading: false, success: 'パスワードを変更しました', error: '' });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (e: unknown) {
      setPwState({ loading: false, error: e instanceof Error ? e.message : '変更に失敗しました', success: '' });
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2 className="modal-title">アカウント設定</h2>
          <button className="close-btn" onClick={onClose} aria-label="閉じる">✕</button>
        </div>

        <div className="settings-scroll">

          {/* ── ユーザー名 ─────────────────────── */}
          <div className="settings-section">
            <button
              className="settings-section-header"
              onClick={() => toggleSection('username')}
            >
              <span className="settings-section-title">ユーザー名</span>
              <span className="settings-section-current">{currentUsername || '未設定'}</span>
              <span className="settings-chevron">{openSection === 'username' ? '▲' : '▼'}</span>
            </button>

            {openSection === 'username' && (
              <div className="settings-section-body">
                <input
                  className="form-input"
                  type="text"
                  placeholder="新しいユーザー名"
                  value={newUsername}
                  onChange={e => { setNewUsername(e.target.value); setUsernameState({ error: '', success: '' }); }}
                />
                {usernameState.error && <p className="settings-error">{usernameState.error}</p>}
                {usernameState.success && <p className="settings-success">{usernameState.success}</p>}
                <button
                  className="btn btn-primary"
                  onClick={handleUpdateUsername}
                  disabled={!newUsername.trim() || usernameState.loading}
                >
                  {usernameState.loading ? '保存中...' : '保存する'}
                </button>
              </div>
            )}
          </div>

          {/* ── メールアドレス ─────────────────── */}
          <div className="settings-section">
            <button
              className="settings-section-header"
              onClick={() => toggleSection('email')}
            >
              <span className="settings-section-title">メールアドレス</span>
              <span className="settings-section-current">{currentEmail}</span>
              <span className="settings-chevron">{openSection === 'email' ? '▲' : '▼'}</span>
            </button>

            {openSection === 'email' && (
              <div className="settings-section-body">
                <input
                  className="form-input"
                  type="email"
                  placeholder="新しいメールアドレス"
                  value={newEmail}
                  onChange={e => { setNewEmail(e.target.value); setEmailState({ error: '', success: '' }); }}
                />
                {emailState.error && <p className="settings-error">{emailState.error}</p>}
                {emailState.success && <p className="settings-success">{emailState.success}</p>}
                <button
                  className="btn btn-primary"
                  onClick={handleUpdateEmail}
                  disabled={!newEmail.trim() || emailState.loading}
                >
                  {emailState.loading ? '変更中...' : '変更する'}
                </button>
              </div>
            )}
          </div>

          {/* ── パスワード ──────────────────────── */}
          <div className="settings-section">
            <button
              className="settings-section-header"
              onClick={() => toggleSection('password')}
            >
              <span className="settings-section-title">パスワード</span>
              <span className="settings-section-current">••••••••</span>
              <span className="settings-chevron">{openSection === 'password' ? '▲' : '▼'}</span>
            </button>

            {openSection === 'password' && (
              <div className="settings-section-body">
                <input
                  className="form-input"
                  type="password"
                  placeholder="現在のパスワード"
                  value={currentPw}
                  onChange={e => { setCurrentPw(e.target.value); setPwState({ error: '', success: '' }); }}
                />
                <input
                  className="form-input"
                  type="password"
                  placeholder="新しいパスワード（6文字以上）"
                  value={newPw}
                  onChange={e => { setNewPw(e.target.value); setPwState({ error: '', success: '' }); }}
                />
                <input
                  className="form-input"
                  type="password"
                  placeholder="新しいパスワード（確認）"
                  value={confirmPw}
                  onChange={e => { setConfirmPw(e.target.value); setPwState({ error: '', success: '' }); }}
                />
                {newPw && confirmPw && newPw !== confirmPw && (
                  <p className="settings-error">新しいパスワードが一致しません</p>
                )}
                {pwState.error && <p className="settings-error">{pwState.error}</p>}
                {pwState.success && <p className="settings-success">{pwState.success}</p>}
                <button
                  className="btn btn-primary"
                  onClick={handleUpdatePassword}
                  disabled={
                    !currentPw || !newPw || !confirmPw ||
                    newPw !== confirmPw || pwState.loading
                  }
                >
                  {pwState.loading ? '変更中...' : 'パスワードを変更'}
                </button>
              </div>
            )}
          </div>

          {/* ── アカウント削除 ─────────────────── */}
          <div className="settings-section settings-section--danger">
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#EF4444', margin: 0 }}>危険な操作</p>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>アカウントとすべてのデータを完全に削除します。この操作は取り消せません。</p>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  const ok1 = window.confirm('アカウントを削除しますか？\nすべての地図・記録データが失われます。この操作は取り消せません。');
                  if (!ok1) return;
                  const ok2 = window.confirm('最終確認です。本当に削除してよいですか？');
                  if (!ok2) return;
                  try { await onDeleteAccount(); }
                  catch { alert('削除に失敗しました。しばらく経ってから再度お試しください。'); }
                }}
                style={{ alignSelf: 'flex-start' }}
              >
                アカウントを削除する
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
