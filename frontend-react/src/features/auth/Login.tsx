import { useState } from 'react';
import { login, ApiError } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { useI18n } from '../../lib/i18n';
import './login.css';

interface Props {
  mark?: string;
  title: string;
  subtitle: string;
}

export default function Login({ mark = '◆', title, subtitle }: Props) {
  const { lang } = useI18n();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | undefined>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setErrorCode(undefined);
    setLoading(true);
    try {
      await login(username.trim(), password); // App re-renders via useAuth on success
    } catch (err) {
      const code = err instanceof ApiError ? err.errorCode : undefined;
      const message = code === 'ACCOUNT_DISABLED'
        ? L.pending
        : err instanceof ApiError ? err.message : 'Login failed';
      setError(message);
      setErrorCode(code);
      if (code !== 'ACCOUNT_DISABLED') toast(message);
    } finally {
      setLoading(false);
    }
  }

  const L = lang === 'ar'
    ? { user: 'اسم المستخدم', pass: 'كلمة المرور', enter: 'دخول',
        pending: 'حسابك بانتظار تأكيد التحويل البنكي. سنفعّله بعد تأكيد الدفع من لوحة المنصّة.' }
    : { user: 'Username', pass: 'Password', enter: 'Sign in',
        pending: 'Your account is waiting for bank-transfer confirmation. Sign-in unlocks after a platform admin confirms payment.' };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-top"><div className="mark">{mark}</div></div>
        <h1>{title}</h1>
        <div className="sub">{subtitle}</div>
        <div className="field"><label>{L.user}</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} /></div>
        <div className="field"><label>{L.pass}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
        {error && <div className={'login-error' + (errorCode === 'ACCOUNT_DISABLED' ? ' pending' : '')}>{error}</div>}
        <button className="btn full" disabled={loading}>{loading ? '…' : L.enter}</button>
      </form>
    </div>
  );
}
