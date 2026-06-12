import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { LangToggle, useI18n, useT, type Dict } from '../../lib/i18n';
import { omr } from '../../lib/format';
import type { OnboardingInstructions } from '../../lib/types';
import '../landing-designs/designs/l4.css';

const T: Dict = {
  ar: {
    signin: 'دخول', back: '← الرئيسية',
    lbl: 'إنشاء حساب', h: 'ابدأ مع مقهاك.',
    p: 'أنشئ حسابك في دقائق، حوّل الرسوم السنوية، ونفعّل حسابك فور تأكيد التحويل.',
    f_cafe: 'اسم المقهى / النشاط', f_slug: 'المعرّف (اختياري)', f_owner: 'اسمك',
    f_email: 'البريد الإلكتروني', f_phone: 'رقم الجوال', f_pass: 'كلمة المرور',
    f_pass_hint: '8 أحرف على الأقل', f_submit: 'إنشاء الحساب', f_sending: 'جارٍ الإنشاء…',
    ok_h: 'تم إنشاء حسابك ✓',
    ok_p: 'حوّل المبلغ التالي إلى حسابنا البنكي، واكتب الرمز المرجعي في ملاحظة التحويل. سنفعّل حسابك فور تأكيد وصول المبلغ.',
    pay_amount: 'المبلغ (سنوياً)', pay_ref: 'الرمز المرجعي', pay_bank: 'البنك', pay_acc_name: 'اسم الحساب',
    pay_acc_no: 'رقم الحساب', pay_iban: 'الآيبان', copy: 'نسخ', copied: 'تم النسخ ✓',
    next_h: 'بعد التحويل', next_p: 'سنراجع التحويل ونفعّل حسابك. عندها فقط يمكنك تسجيل الدخول من لوحة المقهى.',
    next_cta: 'العودة للرئيسية ←',
    foot_made: 'صُنع لمقاهي وأنشطة عُمان الغذائية', foot_rights: 'جميع الحقوق محفوظة', foot_language: 'اللغة',
    foot_links: 'روابط', foot_dashboard: 'لوحة الإدارة', foot_admin: 'لوحة المنصّة',
    foot_contact: 'تواصل', foot_legal: 'القانوني', foot_privacy: 'الخصوصية', foot_terms: 'الشروط', foot_refund: 'الاسترداد',
  },
  en: {
    signin: 'Sign in', back: '← Home',
    lbl: 'Create account', h: 'Start with your café.',
    p: 'Create your account in minutes, send the yearly fee by transfer, and we activate you the moment it’s confirmed.',
    f_cafe: 'Business / café name', f_slug: 'Slug (optional)', f_owner: 'Your name',
    f_email: 'Email', f_phone: 'Phone number', f_pass: 'Password',
    f_pass_hint: 'at least 8 characters', f_submit: 'Create account', f_sending: 'Creating…',
    ok_h: 'Account created ✓',
    ok_p: 'Transfer the amount below to our bank account and put the reference in the transfer note. We’ll activate your account once we confirm it.',
    pay_amount: 'Amount (per year)', pay_ref: 'Reference', pay_bank: 'Bank', pay_acc_name: 'Account name',
    pay_acc_no: 'Account number', pay_iban: 'IBAN', copy: 'Copy', copied: 'Copied ✓',
    next_h: 'After you transfer', next_p: 'We’ll review the transfer and enable your account. Only then can you sign in from the café dashboard.',
    next_cta: 'Back home →',
    foot_made: 'Made for Omani cafés and food businesses', foot_rights: 'All rights reserved', foot_language: 'Language',
    foot_links: 'Links', foot_dashboard: 'Dashboard', foot_admin: 'Platform',
    foot_contact: 'Contact', foot_legal: 'Legal', foot_privacy: 'Privacy', foot_terms: 'Terms', foot_refund: 'Refunds',
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
    <div className="lz-screen b4 b4-page-shell" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <nav className="b4-nav b4-simple-nav">
        <Link className="b4-brand" to="/">SERVA<span>.</span></Link>
        <div className="b4-tools">
          <Link className="b4-signin" to="/">{t('back')}</Link>
          <Link className="b4-signin" to="/dashboard">{t('signin')}</Link>
        </div>
      </nav>

      <section className="b4-sec b4-page-main">
        <div className="b4-pagecard">
          <div className="b4-pagecopy">
            <div className="b4-seclbl">{t('lbl')}</div>
            <h1 className="b4-h2">{t('h')}</h1>
            {!result && <p className="b4-lead">{t('p')}</p>}
          </div>

          {result ? (
            <PaymentInstructions x={result} t={t} toast={toast} />
          ) : (
            <form className="b4-form b4-signup-form" onSubmit={submit}>
              <label><span>{t('f_cafe')}</span><input value={f.cafeName} onChange={(e) => set('cafeName', e.target.value)} required /></label>
              <label><span>{t('f_slug')}</span><input className="num" value={f.slug} onChange={(e) => set('slug', e.target.value)} placeholder="my-cafe" /></label>
              <label><span>{t('f_owner')}</span><input value={f.ownerName} onChange={(e) => set('ownerName', e.target.value)} required /></label>
              <label><span>{t('f_email')}</span><input className="num" type="email" inputMode="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="owner@cafe.om" required /></label>
              <label><span>{t('f_phone')}</span><input className="num" inputMode="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="9XXXXXXX" /></label>
              <label><span>{t('f_pass')}</span><input className="num" type="password" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder={t('f_pass_hint')} required minLength={8} /></label>
              <button className="b4-btn lg full" type="submit" disabled={!valid || loading}>{loading ? t('f_sending') : `${t('f_submit')} ↗`}</button>
            </form>
          )}
        </div>
      </section>

      <SignupFooter t={t} />
    </div>
  );
}

function SignupFooter({ t }: { t: (k: string) => string }) {
  return (
    <footer className="b4-foot home">
      <div className="b4-footgrid">
        <div className="b4-footbrand">
          <div className="b4-brand">SERVA<span>.</span></div>
          <p>{t('foot_made')}</p>
          <div className="b4-footlang">
            <h4>{t('foot_language')}</h4>
            <LangToggle />
          </div>
        </div>
        <div>
          <h4>{t('foot_links')}</h4>
          <Link to="/signup">{t('f_submit')}</Link>
          <Link to="/dashboard">{t('foot_dashboard')}</Link>
          <Link to="/admin">{t('foot_admin')}</Link>
        </div>
        <div>
          <h4>{t('foot_contact')}</h4>
          <a href="mailto:hello@serva.app">hello@serva.app</a>
          <a href="tel:+96890000000">+968 9000 0000</a>
          <Link to="/signup">{t('f_submit')}</Link>
        </div>
        <div>
          <h4>{t('foot_legal')}</h4>
          <Link to="/privacy">{t('foot_privacy')}</Link>
          <Link to="/terms">{t('foot_terms')}</Link>
          <Link to="/refund">{t('foot_refund')}</Link>
        </div>
      </div>
      <div className="b4-bignme">SERVA.</div>
      <div className="b4-footbar"><span>© {new Date().getFullYear()} SERVA</span><span>{t('foot_made')}</span><span>{t('foot_rights')}</span></div>
    </footer>
  );
}

function PaymentInstructions({ x, t, toast }: {
  x: OnboardingInstructions; t: (k: string) => string; toast: (m: string) => void;
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
    <div className="b4-pay">
      <div className="b4-okmk">✓</div>
      <h3 className="b4-pay-h">{t('ok_h')}</h3>
      <p className="b4-pay-p">{t('ok_p')}</p>

      <div className="b4-pay-hero">
        <div className="b4-pay-amount">
          <span className="lab">{t('pay_amount')}</span>
          <span className="val">{omr(x.amount)} <small>{x.currency}</small></span>
        </div>
        <button className="b4-pay-ref" onClick={() => copy(x.reference)} title={t('copy')}>
          <span className="lab">{t('pay_ref')}</span>
          <span className="val">{x.reference}</span>
          <span className="cp">⧉ {t('copy')}</span>
        </button>
      </div>

      <div className="b4-pay-rows">
        {rows.map(([k, v, mono]) => (
          <div className="b4-pay-row" key={k}>
            <span className="k">{k}</span>
            <span className={'v' + (mono ? ' num' : '')}>{v}</span>
            <button className="b4-copy" onClick={() => copy(v)} title={t('copy')}>⧉</button>
          </div>
        ))}
      </div>

      <div className="b4-pay-next">
        <h4>{t('next_h')}</h4>
        <p>{t('next_p')}</p>
        <Link className="b4-btn" to="/">{t('next_cta')}</Link>
      </div>
    </div>
  );
}
