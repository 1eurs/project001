import { useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, upload, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useI18n, useT, pick, type Dict } from '../../lib/i18n';
import { useToast } from '../../lib/toast';
import { omr } from '../../lib/format';
import type { CategoryResponse, MenuItemResponse } from '../../lib/types';

const DICT: Dict = {
  ar: { addCat: '＋ قسم', addItem: '＋ صنف', editCat: 'تعديل القسم', newCat: 'قسم جديد', editItem: 'تعديل الصنف', newItem: 'صنف جديد',
        nameAr: 'الاسم (عربي)', nameEn: 'الاسم (إنجليزي)', descAr: 'الوصف (عربي)', descEn: 'الوصف (إنجليزي)',
        price: 'السعر', prep: 'دقائق التحضير', category: 'القسم', available: 'متوفر الآن', image: 'الصورة', uploadImg: 'رفع صورة', uploading: 'جارٍ الرفع…',
        save: 'حفظ', cancel: 'إلغاء', del: 'حذف', cur: 'ر.ع', noItems: 'لا أصناف بعد',
        delCat: 'حذف هذا القسم وكل أصنافه؟', delItem: 'حذف هذا الصنف؟', empty: 'لا توجد أقسام — ابدأ بإضافة قسم', items: 'أصناف' },
  en: { addCat: '＋ Category', addItem: '＋ Item', editCat: 'Edit category', newCat: 'New category', editItem: 'Edit item', newItem: 'New item',
        nameAr: 'Name (Arabic)', nameEn: 'Name (English)', descAr: 'Description (Arabic)', descEn: 'Description (English)',
        price: 'Price', prep: 'Prep minutes', category: 'Category', available: 'Available now', image: 'Photo', uploadImg: 'Upload photo', uploading: 'Uploading…',
        save: 'Save', cancel: 'Cancel', del: 'Delete', cur: 'OMR', noItems: 'No items yet',
        delCat: 'Delete this category and all its items?', delItem: 'Delete this item?', empty: 'No categories — add one to start', items: 'items' },
};

const thumb = (it: MenuItemResponse) => it.imageUrl
  ? { backgroundImage: `url('${it.imageUrl}')` }
  : { backgroundImage: `linear-gradient(155deg, hsl(${(it.id * 47) % 360} 42% 34%) -30%, #15171C 70%)` };

export default function MenuManager() {
  const { user } = useAuth();
  const rid = user!.restaurantId!;
  const { lang } = useI18n();
  const t = useT(DICT);
  const toast = useToast();
  const qc = useQueryClient();

  const catsQ = useQuery({ queryKey: ['menu-cats', rid], queryFn: () => api.get<CategoryResponse[]>(`/api/menu/categories?restaurantId=${rid}`) });
  const itemsQ = useQuery({ queryKey: ['menu-items', rid], queryFn: () => api.get<MenuItemResponse[]>(`/api/menu/items?restaurantId=${rid}`) });
  const cats = useMemo(() => [...(catsQ.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder), [catsQ.data]);
  const itemsByCat = useMemo(() => {
    const m = new Map<number, MenuItemResponse[]>();
    (itemsQ.data ?? []).forEach((i) => { const a = m.get(i.categoryId) ?? []; a.push(i); m.set(i.categoryId, a); });
    m.forEach((a) => a.sort((x, y) => x.displayOrder - y.displayOrder));
    return m;
  }, [itemsQ.data]);

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['menu-cats', rid] }); qc.invalidateQueries({ queryKey: ['menu-items', rid] }); };
  const err = (e: unknown) => toast(e instanceof ApiError ? e.message : 'Error');

  const toggleAvail = useMutation({
    mutationFn: (it: MenuItemResponse) => api.patch(`/api/menu/items/${it.id}/availability`, { available: !it.available }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items', rid] }), onError: err,
  });
  const delItem = useMutation({ mutationFn: (id: number) => api.del(`/api/menu/items/${id}`), onSuccess: invalidate, onError: err });
  const delCat = useMutation({ mutationFn: (id: number) => api.del(`/api/menu/categories/${id}`), onSuccess: invalidate, onError: err });

  const [catModal, setCatModal] = useState<CategoryResponse | 'new' | null>(null);
  const [itemModal, setItemModal] = useState<MenuItemResponse | { categoryId: number } | null>(null);

  return (
    <div className="tables-wrap">
      <div className="tables-tool">
        <button className="btn sm" onClick={() => setCatModal('new')}>{t('addCat')}</button>
      </div>

      {catsQ.isLoading ? <div className="center"><div className="spinner" /></div>
        : cats.length === 0 ? <div className="empty"><div className="big">📋</div><h3>{t('empty')}</h3></div>
        : cats.map((c) => {
          const items = itemsByCat.get(c.id) ?? [];
          return (
            <section className="mcat" key={c.id}>
              <div className="mcat-hd">
                <div><h3>{pick(c, 'name', lang)}</h3><span className="mcat-sub">{c.nameEn} · {items.length} {t('items')}</span></div>
                <div className="mcat-actions">
                  <button className="btn sm ghost" onClick={() => setItemModal({ categoryId: c.id })}>{t('addItem')}</button>
                  <button className="iconbtn" title={t('editCat')} onClick={() => setCatModal(c)}>✎</button>
                  <button className="iconbtn danger" title={t('del')} onClick={() => { if (confirm(t('delCat'))) delCat.mutate(c.id); }}>🗑</button>
                </div>
              </div>
              {items.length === 0 ? <div className="col-empty" style={{ marginTop: 4 }}>{t('noItems')}</div> : (
                <div className="mitems">
                  {items.map((it) => (
                    <div className={'mitem' + (it.available ? '' : ' off')} key={it.id}>
                      <div className="c-thumb" style={{ ...thumb(it), width: 54, height: 54, flex: '0 0 54px', borderRadius: 12 }}>
                        {!it.imageUrl && <span className="glyph" style={{ fontSize: 20 }}>{pick(it, 'name', lang).charAt(0)}</span>}
                      </div>
                      <div className="mitem-main">
                        <div className="mitem-name">{pick(it, 'name', lang)}</div>
                        <div className="mitem-sub">{it.nameEn}{it.preparationTimeMinutes ? ` · ⏱ ${it.preparationTimeMinutes}m` : ''}</div>
                      </div>
                      <div className="mitem-price num">{omr(it.price)} <span style={{ fontSize: 10, color: 'var(--muted)' }}>{t('cur')}</span></div>
                      <button className={'switch' + (it.available ? ' on' : '')} title={t('available')} onClick={() => toggleAvail.mutate(it)}><span /></button>
                      <button className="iconbtn" title={t('editItem')} onClick={() => setItemModal(it)}>✎</button>
                      <button className="iconbtn danger" title={t('del')} onClick={() => { if (confirm(t('delItem'))) delItem.mutate(it.id); }}>🗑</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}

      {catModal && <CategoryEditor rid={rid} cat={catModal === 'new' ? null : catModal} onClose={() => setCatModal(null)} onDone={() => { invalidate(); setCatModal(null); }} />}
      {itemModal && <ItemEditor rid={rid} cats={cats} item={'id' in itemModal ? itemModal : null} defaultCat={'categoryId' in itemModal ? itemModal.categoryId : undefined} onClose={() => setItemModal(null)} onDone={() => { invalidate(); setItemModal(null); }} />}
    </div>
  );
}

function CategoryEditor({ rid, cat, onClose, onDone }: { rid: number; cat: CategoryResponse | null; onClose: () => void; onDone: () => void }) {
  const t = useT(DICT); const toast = useToast();
  const [f, setF] = useState({ nameAr: cat?.nameAr ?? '', nameEn: cat?.nameEn ?? '', descriptionAr: cat?.descriptionAr ?? '', descriptionEn: cat?.descriptionEn ?? '', displayOrder: cat?.displayOrder ?? 0 });
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  const save = useMutation({
    mutationFn: () => cat
      ? api.patch(`/api/menu/categories/${cat.id}`, f)
      : api.post('/api/menu/categories', { restaurantId: rid, ...f }),
    onSuccess: onDone, onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });
  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <h3>{cat ? t('editCat') : t('newCat')}</h3>
        <div className="row2">
          <div className="field"><label>{t('nameAr')}</label><input value={f.nameAr} onChange={(e) => set('nameAr', e.target.value)} /></div>
          <div className="field"><label>{t('nameEn')}</label><input value={f.nameEn} onChange={(e) => set('nameEn', e.target.value)} /></div>
        </div>
        <div className="field"><label>{t('descAr')}</label><input value={f.descriptionAr} onChange={(e) => set('descriptionAr', e.target.value)} /></div>
        <div className="field"><label>{t('descEn')}</label><input value={f.descriptionEn} onChange={(e) => set('descriptionEn', e.target.value)} /></div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn" disabled={!f.nameAr || !f.nameEn || save.isPending} onClick={() => save.mutate()}>{t('save')}</button>
        </div>
      </div>
    </div>
  );
}

function ItemEditor({ rid, cats, item, defaultCat, onClose, onDone }:
  { rid: number; cats: CategoryResponse[]; item: MenuItemResponse | null; defaultCat?: number; onClose: () => void; onDone: () => void }) {
  const t = useT(DICT); const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [f, setF] = useState({
    categoryId: item?.categoryId ?? defaultCat ?? cats[0]?.id,
    nameAr: item?.nameAr ?? '', nameEn: item?.nameEn ?? '',
    descriptionAr: item?.descriptionAr ?? '', descriptionEn: item?.descriptionEn ?? '',
    price: item ? String(item.price) : '', preparationTimeMinutes: item?.preparationTimeMinutes ?? '',
    imageUrl: item?.imageUrl ?? '', available: item?.available ?? true,
  });
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const { url } = await upload('/api/uploads/menu-items', file); set('imageUrl', url); }
    catch (err) { toast(err instanceof ApiError ? err.message : 'Upload failed'); }
    finally { setUploading(false); }
  }

  const save = useMutation({
    mutationFn: () => {
      const body: any = {
        categoryId: f.categoryId, nameAr: f.nameAr, nameEn: f.nameEn,
        descriptionAr: f.descriptionAr || null, descriptionEn: f.descriptionEn || null,
        price: Number(f.price), imageUrl: f.imageUrl || null,
        preparationTimeMinutes: f.preparationTimeMinutes ? Number(f.preparationTimeMinutes) : null,
        available: f.available,
      };
      return item ? api.patch(`/api/menu/items/${item.id}`, body) : api.post('/api/menu/items', { restaurantId: rid, ...body });
    },
    onSuccess: onDone, onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  const valid = f.nameAr && f.nameEn && Number(f.price) > 0 && f.categoryId;

  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <h3>{item ? t('editItem') : t('newItem')}</h3>
        <div className="itemedit">
          <div className="imgpick" style={f.imageUrl ? { backgroundImage: `url('${f.imageUrl}')` } : {}} onClick={() => fileRef.current?.click()}>
            {!f.imageUrl && <span>{uploading ? t('uploading') : '＋ ' + t('image')}</span>}
            {uploading && f.imageUrl && <span className="imgpick-load">{t('uploading')}</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          <div style={{ flex: 1 }}>
            <div className="field"><label>{t('category')}</label>
              <select value={f.categoryId} onChange={(e) => set('categoryId', Number(e.target.value))}>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.nameAr} / {c.nameEn}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="row2">
          <div className="field"><label>{t('nameAr')}</label><input value={f.nameAr} onChange={(e) => set('nameAr', e.target.value)} /></div>
          <div className="field"><label>{t('nameEn')}</label><input value={f.nameEn} onChange={(e) => set('nameEn', e.target.value)} /></div>
        </div>
        <div className="row2">
          <div className="field"><label>{t('price')} ({t('cur')})</label><input className="num" type="number" step="0.001" value={f.price} onChange={(e) => set('price', e.target.value)} /></div>
          <div className="field"><label>{t('prep')}</label><input className="num" type="number" value={f.preparationTimeMinutes} onChange={(e) => set('preparationTimeMinutes', e.target.value)} /></div>
        </div>
        <div className="field"><label>{t('descAr')}</label><input value={f.descriptionAr} onChange={(e) => set('descriptionAr', e.target.value)} /></div>
        <div className="field"><label>{t('descEn')}</label><input value={f.descriptionEn} onChange={(e) => set('descriptionEn', e.target.value)} /></div>
        <label className="checkrow"><input type="checkbox" checked={f.available} onChange={(e) => set('available', e.target.checked)} /> {t('available')}</label>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn" disabled={!valid || save.isPending || uploading} onClick={() => save.mutate()}>{t('save')}</button>
        </div>
      </div>
    </div>
  );
}
