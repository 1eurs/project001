import { useState } from 'react';
import { login, ApiError } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { useI18n, LangToggle } from '../../lib/i18n';
import { ThemeToggle } from '../../lib/theme';
import './login.css';

interface Props {
  mark?: string;
  title: string;
  subtitle: string;
  demo?: { email: string; password: string };
}

export default function Login({ mark = '◆', title, subtitle, demo }: Props) {
  const { lang } = useI18n();
  const toast = useToast();
  const [email, setEmail] = useState(demo?.email ?? '');
  const [password, setPassword] = useState(demo?.password ?? '');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password); // App re-renders via useAuth on success
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  const L = lang === 'ar'
    ? { email: 'البريد الإلكتروني', pass: 'كلمة المرور', enter: 'دخول', note: 'عرض تجريبي' }
    : { email: 'Email', pass: 'Password', enter: 'Sign in', note: 'Demo' };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-top"><div className="mark">{mark}</div><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><ThemeToggle /><LangToggle /></div></div>
        <h1>{title}</h1>
        <div className="sub">{subtitle}</div>
        <div className="field"><label>{L.email}</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></div>
        <div className="field"><label>{L.pass}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
        <button className="btn full" disabled={loading}>{loading ? '…' : L.enter}</button>
        {demo && <div className="demo-note">{L.note} · {demo.email}</div>}
      </form>
    </div>
  );
}
