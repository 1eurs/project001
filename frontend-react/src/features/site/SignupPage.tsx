import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { useI18n, useT, LangToggle, type Dict } from '../../lib/i18n';
import { ThemeToggle } from '../../lib/theme';
import { BRAND } from '../../lib/brand';
import { omr } from '../../lib/format';
import type { OnboardingInstructions } from '../../lib/types';
import './site.css';

const T: Dict = {
  ar: {
    signin: 'دخول', back: '← الرئيسية',
    lbl: 'إنشاء حساب', h: 'ابدأ مع مقهاك.',
    p: 'أنشئ حسابك في دقائق، حوّل الرسوم السنوية، ونفعّل حسابك فور تأكيد التحويل.',
    f_cafe: 'اسم المقهى / العربة', f_slug: 'المعرّف (اختياري)', f_owner: 'اسمك',
    f_email: 'البريد الإلكتروني', f_phone: 'رقم الجوال', f_pass: 'كلمة المرور',
    f_pass_hint: '8 أحرف على الأقل', f_submit: 'إنشاء الحساب', f_sending: 'جارٍ الإنشاء…',
    ok_h: 'تم إنشاء حسابك ✓',
    ok_p: 'حوّل المبلغ التالي إلى حسابنا البنكي، واكتب الرمز المرجعي في ملاحظة التحويل. سنفعّل حسابك فور تأكيد وصول المبلغ.',
    pay_amount: 'المبلغ (سنوياً)', pay_ref: 'الرمز المرجعي', pay_bank: 'البنك', pay_acc_name: 'اسم الحساب',
    pay_acc_no: 'رقم الحساب', pay_iban: 'الآيبان', copy: 'نسخ', copied: 'تم النسخ ✓',
    next_h: 'بعد التحويل', next_p: 'سنراجع التحويل ونفعّل حسابك. عندها تسجّل الدخول من لوحة المقهى.',
    next_cta: 'تسجيل الدخول ←',
  },
  en: {
    signin: 'Sign in', back: '← Home',
    lbl: 'Create account', h: 'Start with your café.',
    p: 'Create your account in minutes, send the yearly fee by transfer, and we activate you the moment it’s confirmed.',
    f_cafe: 'Café / truck name', f_slug: 'Slug (optional)', f_owner: 'Your name',
    f_email: 'Email', f_phone: 'Phone number', f_pass: 'Password',
    f_pass_hint: 'at least 8 characters', f_submit: 'Create account', f_sending: 'Creating…',
    ok_h: 'Account created ✓',
    ok_p: 'Transfer the amount below to our bank account and put the reference in the transfer note. We’ll activate your account once we confirm it.',
    pay_amount: 'Amount (per year)', pay_ref: 'Reference', pay_bank: 'Bank', pay_acc_name: 'Account name',
    pay_acc_no: 'Account number', pay_iban: 'IBAN', copy: 'Copy', copied: 'Copied ✓',
    next_h: 'After you transfer', next_p: 'We’ll review the transfer and enable your account. Then sign in from the café dashboard.',
    next_cta: 'Go to sign in →',
  },
};

export default function SignupPage() {
  const { lang } = useI18n();
  const t = useT(T);
  const toast = useToast();
  const [f, setF] = useState({ cafeName: '', slug: '', ownerName: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OnboardingInstructions | null>(null);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const valid = f.cafeName.trim() && f.ownerName.trim() && f.email.trim() && f.password.length >= 8;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    try {
      const data = await api.post<OnboardingInstructions>('/api/public/onboarding', {
        cafeName: f.cafeName.trim(),
        slug: f.slug.trim() || undefined,
        ownerName: f.ownerName.trim(),
        email: f.email.trim(),
        phone: f.phone.trim() || undefined,
        password: f.password,
      }, { auth: false });
      setResult(data);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ed">
      <div className="ed-glyph" aria-hidden>ق</div>

      <nav className="ed-top">
        <div className="ed-wrap row">
          <Link className="ed-mark" to="/">
            <span className="mk">{BRAND.name.charAt(0)}</span><span>{BRAND.name}</span>
          </Link>
          <div className="ed-nav"><Link to="/">{t('back')}</Link></div>
          <div className="ed-tools">
            <Link className="ed-signin" to="/dashboard">{t('signin')}</Link>
            <ThemeToggle /><LangToggle />
          </div>
        </div>
      </nav>

      <section className="ed-sec ed-wrap">
        <div className="ed-lbl"><span className="n">✦</span>{t('lbl')}</div>
        <h2 className="ed-statement">{t('h')}</h2>

        {result ? (
          <PaymentInstructions x={result} t={t} lang={lang} toast={toast} />
        ) : (
          <>
            <p className="ed-lead" style={{ marginTop: 14 }}>{t('p')}</p>
            <form className="ed-form" onSubmit={submit}>
              <label className="ef"><span>{t('f_cafe')}</span><input value={f.cafeName} onChange={(e) => set('cafeName', e.target.value)} required /></label>
              <label className="ef"><span>{t('f_slug')}</span><input className="num" value={f.slug} onChange={(e) => set('slug', e.target.value)} placeholder="my-cafe" /></label>
              <label className="ef"><span>{t('f_owner')}</span><input value={f.ownerName} onChange={(e) => set('ownerName', e.target.value)} required /></label>
              <label className="ef"><span>{t('f_email')}</span><input className="num" type="email" inputMode="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="owner@cafe.om" required /></label>
              <label className="ef"><span>{t('f_phone')}</span><input className="num" inputMode="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="9XXXXXXX" /></label>
              <label className="ef"><span>{t('f_pass')}</span><input className="num" type="password" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder={t('f_pass_hint')} required minLength={8} /></label>
              <div className="ed-form-foot">
                <button className="btn" type="submit" disabled={!valid || loading}>{loading ? t('f_sending') : `${t('f_submit')} ↗`}</button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function PaymentInstructions({ x, t, lang, toast }: {
  x: OnboardingInstructions; t: (k: string) => string; lang: string; toast: (m: string) => void;
}) {
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); toast(t('copied')); }
    catch { toast(value); }
  };
  const rows: [string, string, boolean][] = [
    [t('pay_bank'), x.bankName, false],
    [t('pay_acc_name'), x.accountName, false],
    [t('pay_acc_no'), x.accountNumber, true],
    [t('pay_iban'), x.iban, true],
  ];

  return (
    <div className="ed-pay">
      <div className="ed-ok-mk">✓</div>
      <h3 className="ed-pay-h">{t('ok_h')}</h3>
      <p className="ed-pay-p">{t('ok_p')}</p>

      <div className="ed-pay-hero">
        <div className="ed-pay-amount">
          <span className="lab">{t('pay_amount')}</span>
          <span className="val">{omr(x.amount)} <small>{x.currency}</small></span>
        </div>
        <button className="ed-pay-ref" onClick={() => copy(x.reference)} title={t('copy')}>
          <span className="lab">{t('pay_ref')}</span>
          <span className="val">{x.reference}</span>
          <span className="cp">⧉ {t('copy')}</span>
        </button>
      </div>

      <div className="ed-pay-rows">
        {rows.map(([k, v, mono]) => (
          <div className="ed-pay-row" key={k}>
            <span className="k">{k}</span>
            <span className={'v' + (mono ? ' num' : '')}>{v}</span>
            <button className="ed-copy" onClick={() => copy(v)} title={t('copy')}>⧉</button>
          </div>
        ))}
      </div>

      <div className="ed-pay-next">
        <h4>{t('next_h')}</h4>
        <p>{t('next_p')}</p>
        <Link className="ed-link" to="/dashboard">{t('next_cta')}</Link>
      </div>
    </div>
  );
}
