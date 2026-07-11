import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, upload, ApiError } from '../../lib/api';
import { useAuth, can } from '../../lib/auth';
import { useI18n, useT, type Dict } from '../../lib/i18n';
import { useToast } from '../../lib/toast';
import { isPrintStation, setPrintStation, checkPrintServer, getLastPrintAttempt, type PrintAttempt } from '../../lib/printer';
import { useReceiptPrinter } from './receiptPrinter';
import type { Restaurant, Subscription, BranchResponse, OrderResponse } from '../../lib/types';

const DICT: Dict = {
  ar: {
    title: 'ملف المطعم', sub: 'البيانات التي تظهر في قائمة العملاء والفواتير.',
    detailsTitle: 'بيانات المطعم', detailsSub: 'معلومات التواصل والهوية التي يراها عملاؤك.',
    operationsTitle: 'الطلبات والضريبة', operationsSub: 'إعدادات التشغيل التي تؤثر على التحصيل والفواتير.',
    branchTitle: 'الفرع ورابط القائمة', branchSub: 'إدارة اسم الفرع الحالي وعنوان القائمة العامة.',
    vatHelp: 'أظهر ضريبة القيمة المضافة في الطلبات والفواتير.',
    menuLinkHelp: 'هذا هو الرابط العام الذي يفتحه عملاؤك.',
    name: 'اسم المطعم', phone: 'الهاتف', email: 'البريد', instagram: 'إنستجرام',
    currency: 'العملة', vatEnabled: 'تفعيل الضريبة', vatRate: 'نسبة الضريبة', logo: 'شعار المطعم',
    paymentSelection: 'اختيار طريقة الدفع عند التحصيل', paymentSelectionSub: 'عند التفعيل، يختار الموظف نقداً أو بطاقة قبل إنهاء الطلب. عند الإيقاف، تُسجّل البطاقة افتراضياً.',
    uploadLogo: 'رفع الشعار', removeLogo: 'إزالة الشعار', logoRemoved: 'تم إزالة الشعار', uploading: 'جارٍ الرفع...', save: 'حفظ الملف', saved: 'تم الحفظ', openMenu: 'فتح القائمة',
    slug: 'رابط القائمة', active: 'نشط',
    subscription: 'الاشتراك', plan: 'الباقة', sstatus: 'الحالة', renews: 'يتجدد', ended: 'انتهى',
    oneTime: 'دفع مرة واحدة', access: 'الوصول', lifetime: 'مدى الحياة',
    branchName: 'اسم الفرع', saveBranch: 'حفظ', branchSaved: 'تم حفظ الفرع',
    printerEnabled: 'الطباعة التلقائية للفواتير', printerEnabledSub: 'عند التفعيل، عند إنهاء أي طلب (من أي جهاز) يصل إشعار للجهاز المعيّن كمحطة طباعة ويطبع الفاتورة عبر RawBT.',
    printStation: 'محطة الطباعة (هذا الجهاز)', printStationSub: 'فعّل هذا فقط على الجهاز الواحد المتصل بالطابعة. ثبّت تطبيقي RawBT و Server for RawBT من متجر Play على هذا الجهاز وأبقِهما يعملان — الطباعة الصامتة تتم عبرهما.',
    testPrint: 'طباعة تجريبية', testPrintSent: 'أُرسلت الطباعة التجريبية',
    printServerOk: 'خادم الطباعة: متصل', printServerMissing: 'خادم الطباعة غير موجود — ثبّت وشغّل تطبيق "Server for RawBT" وإلا لن تعمل الطباعة التلقائية.',
    lastVia_server: 'آخر طباعة: أُرسلت عبر خادم الطباعة', lastVia_applink: 'آخر طباعة: عبر فتح تطبيق RawBT (احتياطي)', lastVia_none: 'آخر محاولة فشلت — الخادم غير متاح', buildLabel: 'إصدار التطبيق',
    st_PENDING_PAYMENT: 'بانتظار الدفع', st_TRIAL: 'تجريبي', st_ACTIVE: 'نشط',
    st_PAST_DUE: 'متأخر', st_CANCELLED: 'ملغى', st_EXPIRED: 'منتهي',
  },
  en: {
    title: 'Restaurant profile', sub: 'Details shown on the customer menu and receipts.',
    detailsTitle: 'Restaurant details', detailsSub: 'Customer-facing identity and contact information.',
    operationsTitle: 'Orders and tax', operationsSub: 'Operational settings that affect collection and receipts.',
    branchTitle: 'Branch and menu link', branchSub: 'Manage the current branch name and its public menu address.',
    vatHelp: 'Show VAT on customer orders and receipts.',
    menuLinkHelp: 'This is the public address your customers open.',
    name: 'Restaurant name', phone: 'Phone', email: 'Email', instagram: 'Instagram',
    currency: 'Currency', vatEnabled: 'Enable VAT', vatRate: 'VAT rate', logo: 'Restaurant logo',
    paymentSelection: 'Choose payment method at collection', paymentSelectionSub: 'When enabled, staff choose Cash or Card before completing an order. When off, Card is recorded by default.',
    uploadLogo: 'Upload logo', removeLogo: 'Remove logo', logoRemoved: 'Logo removed', uploading: 'Uploading...', save: 'Save profile', saved: 'Saved', openMenu: 'Open menu',
    slug: 'Menu link', active: 'Active',
    subscription: 'Subscription', plan: 'Plan', sstatus: 'Status', renews: 'Renews', ended: 'Ended',
    oneTime: 'One-time access', access: 'Access', lifetime: 'Lifetime',
    branchName: 'Branch name', saveBranch: 'Save', branchSaved: 'Branch saved',
    printerEnabled: 'Auto-print receipts', printerEnabledSub: 'When on, completing any order (from any staff tablet) notifies the print-station device over live updates and prints the receipt via RawBT there.',
    printStation: 'Print station (this device)', printStationSub: 'Turn this on only on the one tablet next to the printer. Install both RawBT and "Server for RawBT" from the Play Store on this device and keep them running — silent printing goes through them.',
    testPrint: 'Test print', testPrintSent: 'Test print sent',
    printServerOk: 'Print server: connected', printServerMissing: 'Print server not found — install and open the "Server for RawBT" app, or auto-print will not work.',
    lastVia_server: 'Last print: sent via print server', lastVia_applink: 'Last print: via RawBT app link (fallback)', lastVia_none: 'Last attempt failed — server unreachable', buildLabel: 'App build',
    st_PENDING_PAYMENT: 'Awaiting payment', st_TRIAL: 'Trial', st_ACTIVE: 'Active',
    st_PAST_DUE: 'Past due', st_CANCELLED: 'Cancelled', st_EXPIRED: 'Expired',
  },
};

/** Synthetic order for the "Test print" button — exercises the whole capture→RawBT→printer
 *  chain during setup without needing a real order. Never sent to the backend. */
function makeTestOrder(restaurantId: number, branchId: number): OrderResponse {
  return {
    id: 0, orderNumber: 'TEST', dailyNumber: 0, trackingToken: '', restaurantId, branchId,
    tableId: null, customerName: 'Print test', orderType: 'DINE_IN', status: 'COMPLETED',
    paymentStatus: 'PAID', subtotal: 0, vatAmount: 0, total: 0,
    items: [{ nameEn: 'Printer OK', nameAr: 'الطابعة تعمل', quantity: 1, price: 0, lineTotal: 0 }],
    createdAt: new Date().toISOString(),
  };
}

export default function RestaurantProfile({ branchId }: { branchId?: number }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const rid = user!.restaurantId!;
  const t = useT(DICT);
  const toast = useToast();
  const qc = useQueryClient();
  const printReceipt = useReceiptPrinter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [form, setForm] = useState({
    name: '',
    logoUrl: '',
    phone: '',
    email: '',
    instagramUrl: '',
    currency: 'OMR',
    vatEnabled: true,
    vatRate: '5',
    paymentMethodSelectionEnabled: false,
  });

  const restaurantQ = useQuery({
    queryKey: ['restaurant', rid],
    queryFn: () => api.get<Restaurant>(`/api/restaurants/${rid}`),
  });

  // Subscription is owner-visible; admin-created cafés may have none → don't retry a 404.
  const subscriptionQ = useQuery({
    queryKey: ['subscription', rid],
    queryFn: () => api.get<Subscription>(`/api/restaurants/${rid}/subscription`),
    retry: false,
  });
  const sub = subscriptionQ.data;

  // Shares the cache key the dashboard shell uses, so a rename reflects everywhere.
  const branchesQ = useQuery({
    queryKey: ['branches', rid],
    queryFn: () => api.get<BranchResponse[]>(`/api/restaurants/${rid}/branches`),
  });
  const branch = branchesQ.data?.find((b) => b.id === branchId) ?? branchesQ.data?.[0];
  useEffect(() => { if (branch) setBranchName(branch.name); }, [branch?.id]); // eslint-disable-line

  // Device-local, not saved to the backend — see printer.ts. Re-read whenever the branch
  // in view changes, since the flag is scoped per branch.
  const [printStationOn, setPrintStationOn] = useState(false);
  useEffect(() => { if (branch) setPrintStationOn(isPrintStation(branch.id)); }, [branch?.id]);

  // Live probe of the local "Server for RawBT" WebSocket while this page is open — auto-print
  // depends on it (gesture-less prints can't use the rawbt: scheme), so surface its absence
  // here where staff set the station up instead of letting receipts silently queue.
  const [printServerUp, setPrintServerUp] = useState<boolean | null>(null);
  const [lastAttempt, setLastAttempt] = useState<PrintAttempt | null>(null);
  useEffect(() => {
    if (!printStationOn) { setPrintServerUp(null); setLastAttempt(null); return; }
    let cancelled = false;
    const probe = () => {
      void checkPrintServer().then((ok) => { if (!cancelled) setPrintServerUp(ok); });
      setLastAttempt(getLastPrintAttempt());
    };
    probe();
    // 4s cadence: fast enough that a "Test print" tap shows its outcome moments later.
    const interval = window.setInterval(probe, 4_000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [printStationOn]);

  const branchSave = useMutation({
    mutationFn: (body: { name?: string; printerEnabled?: boolean }) =>
      api.patch<BranchResponse>(`/api/branches/${branch!.id}`, body),
    onSuccess: (b) => {
      qc.setQueryData<BranchResponse[]>(['branches', rid], (prev = []) => prev.map((x) => (x.id === b.id ? b : x)));
      toast(t('branchSaved'));
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  const isOneTime = sub?.billingCycle === 'ONE_TIME';

  useEffect(() => {
    const r = restaurantQ.data;
    if (!r) return;
    setForm({
      name: r.name ?? '',
      logoUrl: r.logoUrl ?? '',
      phone: r.phone ?? '',
      email: r.email ?? '',
      instagramUrl: r.instagramUrl ?? '',
      currency: r.currency ?? 'OMR',
      vatEnabled: r.vatEnabled,
      vatRate: String(r.vatRate ?? 5),
      paymentMethodSelectionEnabled: r.paymentMethodSelectionEnabled ?? false,
    });
  }, [restaurantQ.data?.id]);

  const save = useMutation({
    mutationFn: () => api.patch<Restaurant>(`/api/restaurants/${rid}`, {
      name: form.name.trim(),
      // Empty string clears the logo server-side; omit only when we intentionally leave it alone.
      logoUrl: form.logoUrl.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      instagramUrl: form.instagramUrl.trim() || null,
      currency: form.currency.trim().toUpperCase() || 'OMR',
      vatEnabled: form.vatEnabled,
      vatRate: Number(form.vatRate) || 0,
      paymentMethodSelectionEnabled: form.paymentMethodSelectionEnabled,
    }),
    onSuccess: (r) => {
      qc.setQueryData(['restaurant', rid], r);
      toast(t('saved'));
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  const removeLogo = useMutation({
    // PATCH: blank logoUrl clears; other fields omitted = unchanged.
    mutationFn: () => api.patch<Restaurant>(`/api/restaurants/${rid}`, { logoUrl: '' }),
    onSuccess: (r) => {
      qc.setQueryData(['restaurant', rid], r);
      setForm((p) => ({ ...p, logoUrl: '' }));
      toast(t('logoRemoved'));
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  async function onLogoFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await upload('/api/uploads/restaurants/logo', file);
      // Persist immediately so the logo sticks without a second "Save profile" click.
      const r = await api.patch<Restaurant>(`/api/restaurants/${rid}`, { logoUrl: url });
      qc.setQueryData(['restaurant', rid], r);
      setForm((p) => ({ ...p, logoUrl: r.logoUrl ?? url }));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const set = (key: keyof typeof form, value: string | boolean) => setForm((p) => ({ ...p, [key]: value }));
  const publicUrl = restaurantQ.data ? `/r/${restaurantQ.data.slug}${branchId != null ? `/b/${branchId}` : ''}` : null;

  return (
    <div className="tables-wrap profile-page">
      <div className="profile-frame">
        <header className="profile-hero">
          <div className="profile-identity">
            <button className="profile-logo" type="button" aria-label={t('uploadLogo')}
              onClick={() => fileRef.current?.click()}
              style={form.logoUrl ? { backgroundImage: `url('${form.logoUrl}')` } : undefined}>
              {!form.logoUrl && <span>{form.name.charAt(0) || 'S'}</span>}
              <i>{t('uploadLogo')}</i>
              {uploading && <em>{t('uploading')}</em>}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onLogoFile} />
            <div className="profile-title">
              <div className={'profile-state' + (restaurantQ.data?.active ? ' on' : '')}>
                <span />{t('active')}
              </div>
              <h3>{form.name || t('title')}</h3>
              <p>{t('sub')}</p>
            </div>
          </div>
          <div className="profile-actions">
            <button className="btn sm ghost" type="button" onClick={() => fileRef.current?.click()} disabled={uploading || removeLogo.isPending}>{t('uploadLogo')}</button>
            {form.logoUrl && (
              <button className="btn sm danger" type="button"
                disabled={uploading || removeLogo.isPending}
                onClick={() => removeLogo.mutate()}>{t('removeLogo')}</button>
            )}
            <button className="btn sm ghost" type="button" disabled={!publicUrl}
              onClick={() => publicUrl && window.open(publicUrl, '_blank', 'noopener,noreferrer')}>↗ {t('openMenu')}</button>
            <button className="btn sm" type="button" disabled={!form.name.trim() || save.isPending || uploading || removeLogo.isPending}
              onClick={() => save.mutate()}>{t('save')}</button>
          </div>
        </header>

        <div className="profile-layout">
          <main className="profile-main">
            <section className="profile-section">
              <div className="profile-section-head">
                <span className="profile-section-no">01</span>
                <div><h4>{t('detailsTitle')}</h4><p>{t('detailsSub')}</p></div>
              </div>
              <div className="profile-fields">
                <label className="field"><span>{t('name')}</span><input value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
                <label className="field"><span>{t('phone')}</span><input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></label>
                <label className="field"><span>{t('email')}</span><input value={form.email} onChange={(e) => set('email', e.target.value)} /></label>
                <label className="field"><span>{t('instagram')}</span><input value={form.instagramUrl} onChange={(e) => set('instagramUrl', e.target.value)} /></label>
                <label className="field profile-currency"><span>{t('currency')}</span><input value={form.currency} maxLength={3} onChange={(e) => set('currency', e.target.value.toUpperCase())} /></label>
              </div>
            </section>

            <section className="profile-section">
              <div className="profile-section-head">
                <span className="profile-section-no">02</span>
                <div><h4>{t('operationsTitle')}</h4><p>{t('operationsSub')}</p></div>
              </div>
              <div className="profile-settings">
                <div className="profile-setting">
                  <div><b>{t('vatEnabled')}</b><span>{t('vatHelp')}</span></div>
                  <button type="button" className={'switch' + (form.vatEnabled ? ' on' : '')}
                    role="switch" aria-checked={form.vatEnabled} aria-label={t('vatEnabled')}
                    onClick={() => set('vatEnabled', !form.vatEnabled)}><span /></button>
                </div>
                <label className={'field profile-vat-rate' + (!form.vatEnabled ? ' disabled' : '')}>
                  <span>{t('vatRate')}</span>
                  <div className="profile-number-input"><input className="num" type="number" min="0" max="100" step="0.1"
                    disabled={!form.vatEnabled} value={form.vatRate} onChange={(e) => set('vatRate', e.target.value)} /><i>%</i></div>
                </label>
                <div className="profile-setting profile-payment-setting">
                  <div><b>{t('paymentSelection')}</b><span>{t('paymentSelectionSub')}</span></div>
                  <button type="button" className={'switch' + (form.paymentMethodSelectionEnabled ? ' on' : '')}
                    role="switch" aria-checked={form.paymentMethodSelectionEnabled} aria-label={t('paymentSelection')}
                    onClick={() => set('paymentMethodSelectionEnabled', !form.paymentMethodSelectionEnabled)}><span /></button>
                </div>
              </div>
            </section>

            <section className="profile-section">
              <div className="profile-section-head">
                <span className="profile-section-no">03</span>
                <div><h4>{t('branchTitle')}</h4><p>{t('branchSub')}</p></div>
              </div>
              <div className="profile-fields">
                {branch && can(user, 'BRANCHES') && (
                  <label className="field"><span>{t('branchName')}</span>
                    <div className="branch-row">
                      <input value={branchName} onChange={(e) => setBranchName(e.target.value)} />
                      <button className="btn sm ghost" type="button"
                        disabled={!branchName.trim() || branchName.trim() === branch.name || branchSave.isPending}
                        onClick={() => branchSave.mutate({ name: branchName.trim() })}>{t('saveBranch')}</button>
                    </div>
                  </label>
                )}
                <label className="field"><span>{t('slug')}</span><input className="num" value={restaurantQ.data?.slug ?? ''} disabled /></label>
              </div>
              {branch && can(user, 'BRANCHES') && (
                <div className="profile-settings">
                  <div className="profile-setting profile-printer-setting">
                    <div><b>{t('printerEnabled')}</b><span>{t('printerEnabledSub')}</span></div>
                    <button type="button" className={'switch' + (branch.printerEnabled ? ' on' : '')}
                      role="switch" aria-checked={branch.printerEnabled} aria-label={t('printerEnabled')}
                      disabled={branchSave.isPending}
                      onClick={() => branchSave.mutate({ printerEnabled: !branch.printerEnabled })}><span /></button>
                  </div>
                  {branch.printerEnabled && (
                    <div className="profile-setting profile-printer-setting">
                      <div>
                        <b>{t('printStation')}</b><span>{t('printStationSub')}</span>
                        {printStationOn && printServerUp != null && (
                          <span className={'print-server-status' + (printServerUp ? ' ok' : ' bad')}>
                            {printServerUp ? '● ' + t('printServerOk') : '● ' + t('printServerMissing')}
                          </span>
                        )}
                        {printStationOn && lastAttempt && (
                          <span className={'print-server-status' + (lastAttempt.ok ? ' ok' : ' bad')}>
                            {(lastAttempt.ok ? '✓ ' : '✗ ')
                              + t(lastAttempt.via === 'server' ? 'lastVia_server' : lastAttempt.via === 'app-link' ? 'lastVia_applink' : 'lastVia_none')
                              + ' · ' + new Date(lastAttempt.at).toLocaleTimeString()}
                          </span>
                        )}
                        {printStationOn && (
                          <span className="print-server-status">{t('buildLabel')}: {__BUILD_TIME__}</span>
                        )}
                      </div>
                      <div className="printer-station-actions">
                        {printStationOn && (
                          <button className="btn sm ghost" type="button"
                            onClick={() => { printReceipt(makeTestOrder(rid, branch.id)); toast(t('testPrintSent')); }}>
                            🖨 {t('testPrint')}
                          </button>
                        )}
                        <button type="button" className={'switch' + (printStationOn ? ' on' : '')}
                          role="switch" aria-checked={printStationOn} aria-label={t('printStation')}
                          onClick={() => {
                            const next = !printStationOn;
                            setPrintStationOn(next);
                            setPrintStation(branch.id, next);
                          }}><span /></button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </main>

          <aside className="profile-aside">
            {sub && (
              <section className="profile-plan-card">
                <span className="profile-side-label">{t('subscription')}</span>
                <div className="profile-plan-name">{isOneTime ? t('oneTime') : sub.planName}</div>
                <b className={'sub-pill st-' + sub.status}>{t('st_' + sub.status)}</b>
                <dl>
                  <div><dt>{isOneTime ? t('access') : sub.status === 'EXPIRED' ? t('ended') : t('renews')}</dt><dd>{isOneTime ? t('lifetime') : fmtDate(sub.endDate)}</dd></div>
                </dl>
              </section>
            )}
            <section className="profile-menu-card">
              <span className="profile-side-label">{t('slug')}</span>
              <code dir="ltr">{restaurantQ.data?.slug ?? '—'}</code>
              <p>{t('menuLinkHelp')}</p>
              <button className="btn sm ghost" type="button" disabled={!publicUrl}
                onClick={() => publicUrl && window.open(publicUrl, '_blank', 'noopener,noreferrer')}>↗ {t('openMenu')}</button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
