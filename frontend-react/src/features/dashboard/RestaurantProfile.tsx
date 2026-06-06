import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, upload, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useT, type Dict } from '../../lib/i18n';
import { useToast } from '../../lib/toast';
import type { Restaurant } from '../../lib/types';

const DICT: Dict = {
  ar: {
    title: 'ملف المطعم', sub: 'البيانات التي تظهر في قائمة العملاء والفواتير.',
    name: 'اسم المطعم', phone: 'الهاتف', email: 'البريد', instagram: 'إنستجرام',
    currency: 'العملة', vatEnabled: 'تفعيل الضريبة', vatRate: 'نسبة الضريبة', logo: 'شعار المطعم',
    uploadLogo: 'رفع الشعار', uploading: 'جارٍ الرفع...', save: 'حفظ الملف', saved: 'تم الحفظ', openMenu: 'فتح القائمة',
    slug: 'رابط القائمة', active: 'نشط',
  },
  en: {
    title: 'Restaurant profile', sub: 'Details shown on the customer menu and receipts.',
    name: 'Restaurant name', phone: 'Phone', email: 'Email', instagram: 'Instagram',
    currency: 'Currency', vatEnabled: 'Enable VAT', vatRate: 'VAT rate', logo: 'Restaurant logo',
    uploadLogo: 'Upload logo', uploading: 'Uploading...', save: 'Save profile', saved: 'Saved', openMenu: 'Open menu',
    slug: 'Menu link', active: 'Active',
  },
};

export default function RestaurantProfile({ branchId }: { branchId?: number }) {
  const { user } = useAuth();
  const rid = user!.restaurantId!;
  const t = useT(DICT);
  const toast = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    logoUrl: '',
    phone: '',
    email: '',
    instagramUrl: '',
    currency: 'OMR',
    vatEnabled: true,
    vatRate: '5',
  });

  const restaurantQ = useQuery({
    queryKey: ['restaurant', rid],
    queryFn: () => api.get<Restaurant>(`/api/restaurants/${rid}`),
  });

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
    });
  }, [restaurantQ.data?.id]);

  const save = useMutation({
    mutationFn: () => api.patch<Restaurant>(`/api/restaurants/${rid}`, {
      name: form.name.trim(),
      logoUrl: form.logoUrl.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      instagramUrl: form.instagramUrl.trim() || null,
      currency: form.currency.trim().toUpperCase() || 'OMR',
      vatEnabled: form.vatEnabled,
      vatRate: Number(form.vatRate) || 0,
    }),
    onSuccess: (r) => {
      qc.setQueryData(['restaurant', rid], r);
      toast(t('saved'));
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  async function onLogoFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await upload('/api/uploads/restaurants/logo', file);
      setForm((p) => ({ ...p, logoUrl: url }));
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
      <section className="profile-hero">
        <button className="profile-logo" type="button" onClick={() => fileRef.current?.click()} style={form.logoUrl ? { backgroundImage: `url('${form.logoUrl}')` } : undefined}>
          {!form.logoUrl && <span>{form.name.charAt(0) || 'S'}</span>}
          {uploading && <em>{t('uploading')}</em>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onLogoFile} />
        <div className="profile-title">
          <span>{t('logo')}</span>
          <h3>{form.name || t('title')}</h3>
          <p>{t('sub')}</p>
          <div className="profile-actions">
            <button className="btn sm ghost" type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>{t('uploadLogo')}</button>
            <button className="btn sm ghost" type="button" disabled={!publicUrl} onClick={() => publicUrl && window.open(publicUrl, '_blank', 'noopener,noreferrer')}>↗ {t('openMenu')}</button>
            <button className="btn sm" type="button" disabled={!form.name.trim() || save.isPending || uploading} onClick={() => save.mutate()}>{t('save')}</button>
          </div>
        </div>
        <div className="profile-status">
          <span>{t('active')}</span>
          <b>{restaurantQ.data?.active ? '✓' : '-'}</b>
        </div>
      </section>

      <section className="profile-grid">
        <label className="field"><span>{t('name')}</span><input value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label className="field"><span>{t('phone')}</span><input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></label>
        <label className="field"><span>{t('email')}</span><input value={form.email} onChange={(e) => set('email', e.target.value)} /></label>
        <label className="field"><span>{t('instagram')}</span><input value={form.instagramUrl} onChange={(e) => set('instagramUrl', e.target.value)} /></label>
        <label className="field"><span>{t('currency')}</span><input value={form.currency} maxLength={3} onChange={(e) => set('currency', e.target.value.toUpperCase())} /></label>
        <label className="field"><span>{t('vatRate')}</span><input className="num" type="number" min="0" max="100" step="0.1" value={form.vatRate} onChange={(e) => set('vatRate', e.target.value)} /></label>
        <label className="checkrow profile-check"><input type="checkbox" checked={form.vatEnabled} onChange={(e) => set('vatEnabled', e.target.checked)} /> {t('vatEnabled')}</label>
        <label className="field"><span>{t('slug')}</span><input value={restaurantQ.data?.slug ?? ''} disabled /></label>
      </section>
    </div>
  );
}
