import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, upload, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useI18n, useT, pick, type Dict } from '../../lib/i18n';
import { useToast } from '../../lib/toast';
import { omr } from '../../lib/format';
import type { CategoryResponse, MenuItemResponse, Restaurant } from '../../lib/types';
import {
  CUSTOM_THEME,
  DEFAULT_CUSTOM_THEME,
  MOTIF_OPTIONS,
  customThemeVars,
  parseCustomTheme,
  serializeCustomTheme,
  type MenuThemeCustom,
} from '../customer/menuThemes';
import '../customer/menu-themes.css';

const DICT: Dict = {
  ar: { addCat: '＋ قسم', addItem: '＋ صنف', editCat: 'تعديل القسم', newCat: 'قسم جديد', editItem: 'تعديل الصنف', newItem: 'صنف جديد',
        nameAr: 'الاسم (عربي)', nameEn: 'الاسم (إنجليزي)', descAr: 'الوصف (عربي)', descEn: 'الوصف (إنجليزي)',
        price: 'السعر', prep: 'دقائق التحضير', category: 'القسم', available: 'متوفر الآن', image: 'الصورة', uploadImg: 'رفع صورة', uploading: 'جارٍ الرفع…',
        save: 'حفظ', cancel: 'إلغاء', del: 'حذف', cur: 'ر.ع', noItems: 'لا أصناف بعد',
        delCat: 'حذف هذا القسم وكل أصنافه؟', delItem: 'حذف هذا الصنف؟', empty: 'لا توجد أقسام — ابدأ بإضافة قسم', items: 'أصناف',
        lookTitle: 'شكل قائمة العملاء', lookSub: 'صمّم شاشة الطلب كهوية صغيرة للمقهى: ألوان واضحة، رسمة خفيفة، وسلة بارزة.',
        custom: 'لوحة التحكم', preview: 'فتح المعاينة', saveLook: 'حفظ الشكل', saved: 'تم الحفظ', shuffle: 'خلط سريع', resetLook: 'رجوع للأصل',
        studioKicker: 'استوديو القائمة', motifStudio: 'تصميم القائمة', colorStudio: 'الألوان المهمة', phonePreview: 'المعاينة الحية',
        sampleCat: 'المشروبات', sampleCat2: 'الحلويات', sampleCat3: 'الفطور',
        sampleItem: 'لاتيه عماني', sampleItem2: 'كيكة تمر', sampleItem3: 'شاي كرك', sampleItem4: 'كرواسون زعتر', sampleItem5: 'قهوة باردة',
        sampleDesc: 'حليب، قهوة عربية، هيل', sampleDesc2: 'تمر، طحينة، رشة بحرية', sampleDesc3: 'شاي أسود، حليب، زعفران', samplePrice: '٢.٤٠', viewCart: 'عرض السلة',
        paper: 'سطح الهاتف', surface: 'البطاقات', text: 'النص', muted: 'النص الثانوي', accent: 'اللون الأساسي', accent2: 'لون مساعد', motifColor: 'لون الرسمة', cartBg: 'شريط السلة',
        motif: 'الرسمة الخفيفة', motifOpacity: 'وضوح الرسمة', mt_none: 'بدون', mt_bean: 'بن', mt_cup: 'كوب', mt_palm: 'نخلة', mt_star: 'نجمة',
        mt_crescent: 'هلال', mt_leaf: 'ورقة', mt_drop: 'قطرة', mt_geo: 'هندسي' },
  en: { addCat: '＋ Category', addItem: '＋ Item', editCat: 'Edit category', newCat: 'New category', editItem: 'Edit item', newItem: 'New item',
        nameAr: 'Name (Arabic)', nameEn: 'Name (English)', descAr: 'Description (Arabic)', descEn: 'Description (English)',
        price: 'Price', prep: 'Prep minutes', category: 'Category', available: 'Available now', image: 'Photo', uploadImg: 'Upload photo', uploading: 'Uploading…',
        save: 'Save', cancel: 'Cancel', del: 'Delete', cur: 'OMR', noItems: 'No items yet',
        delCat: 'Delete this category and all its items?', delItem: 'Delete this item?', empty: 'No categories — add one to start', items: 'items',
        lookTitle: 'Customer menu look', lookSub: 'Design the ordering screen as a tiny brand system: readable colors, a light motif, and a strong cart bar.',
        custom: 'Control board', preview: 'Open preview', saveLook: 'Save look', saved: 'Saved', shuffle: 'Quick mix', resetLook: 'Reset default',
        studioKicker: 'Menu studio', motifStudio: 'Menu design', colorStudio: 'Core colors', phonePreview: 'Live preview',
        sampleCat: 'Drinks', sampleCat2: 'Desserts', sampleCat3: 'Breakfast',
        sampleItem: 'Omani latte', sampleItem2: 'Date cake', sampleItem3: 'Karak tea', sampleItem4: 'Zaatar croissant', sampleItem5: 'Cold brew',
        sampleDesc: 'Milk, Arabic coffee, cardamom', sampleDesc2: 'Dates, tahini, sea salt', sampleDesc3: 'Black tea, milk, saffron', samplePrice: '2.40', viewCart: 'View cart',
        paper: 'Phone surface', surface: 'Cards', text: 'Text', muted: 'Secondary text', accent: 'Primary', accent2: 'Secondary', motifColor: 'Motif color', cartBg: 'Cart bar',
        motif: 'Light motif', motifOpacity: 'Motif strength', mt_none: 'None', mt_bean: 'Beans', mt_cup: 'Cup', mt_palm: 'Palm', mt_star: 'Star',
        mt_crescent: 'Crescent', mt_leaf: 'Leaf', mt_drop: 'Drop', mt_geo: 'Geometric' },
};

const thumb = (it: MenuItemResponse) => it.imageUrl
  ? { backgroundImage: `url('${it.imageUrl}')` }
  : { backgroundImage: `linear-gradient(155deg, hsl(${(it.id * 47) % 360} 42% 34%) -30%, #15171C 70%)` };

type CustomColorKey = 'paper' | 'surface' | 'text' | 'muted' | 'accent' | 'accent2' | 'motifColor' | 'cartBg';

const CUSTOM_FIELDS: { key: CustomColorKey; label: string }[] = [
  { key: 'paper', label: 'paper' },
  { key: 'surface', label: 'surface' },
  { key: 'text', label: 'text' },
  { key: 'muted', label: 'muted' },
  { key: 'accent', label: 'accent' },
  { key: 'accent2', label: 'accent2' },
  { key: 'motifColor', label: 'motifColor' },
  { key: 'cartBg', label: 'cartBg' },
];
const MOTIF_MARKS: Record<MenuThemeCustom['motif'], string> = {
  none: '—', bean: '◖', cup: '☕', palm: '♧', star: '✦', crescent: '☾', leaf: '❧', drop: '❍', geo: '❖',
};

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

export function MenuLookManager({ branchId }: { branchId?: number }) {
  const { user } = useAuth();
  const rid = user!.restaurantId!;
  const t = useT(DICT);
  const toast = useToast();
  const qc = useQueryClient();
  const [customDraft, setCustomDraft] = useState<MenuThemeCustom>(DEFAULT_CUSTOM_THEME);

  const restaurantQ = useQuery({ queryKey: ['restaurant', rid], queryFn: () => api.get<Restaurant>(`/api/restaurants/${rid}`) });
  const saveTheme = useMutation({
    mutationFn: (body: { theme: string; themeCustomJson?: string | null }) => api.patch<Restaurant>(`/api/restaurants/${rid}/theme`, body),
    onSuccess: (r) => { qc.setQueryData(['restaurant', rid], r); toast(t('saved')); },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Error'),
  });

  useEffect(() => {
    if (restaurantQ.data) setCustomDraft(parseCustomTheme(restaurantQ.data.themeCustomJson));
  }, [restaurantQ.data?.id, restaurantQ.data?.themeCustomJson]);

  const previewUrl = restaurantQ.data
    ? `/r/${restaurantQ.data.slug}${branchId != null ? `/b/${branchId}` : ''}`
    : null;
  const openPreview = () => {
    if (previewUrl) window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="tables-wrap look-page">
      <LookPanel
        customDraft={customDraft}
        saving={saveTheme.isPending}
        previewUrl={previewUrl}
        onPreview={openPreview}
        onCustomChange={setCustomDraft}
        onRandomize={() => setCustomDraft(randomCustomTheme(customDraft))}
        onReset={() => setCustomDraft(DEFAULT_CUSTOM_THEME)}
        onCustomSave={() => saveTheme.mutate({ theme: CUSTOM_THEME, themeCustomJson: serializeCustomTheme(customDraft) })}
        t={t}
      />
    </div>
  );
}

function LookPanel({ customDraft, saving, previewUrl, onPreview, onCustomChange, onRandomize, onReset, onCustomSave, t }:
  {
    customDraft: MenuThemeCustom;
    saving: boolean;
    previewUrl: string | null;
    onPreview: () => void;
    onCustomChange: (custom: MenuThemeCustom) => void;
    onRandomize: () => void;
    onReset: () => void;
    onCustomSave: () => void;
    t: (k: string) => string;
  }) {
  return (
    <div className="look-studio">
      {/* The stage is a fixed neutral canvas — it follows neither the dashboard theme nor
          the generated menu theme. Only the phone inside reflects the menu's colours. */}
      <section className="look-stage">
        <MiniMenuPreview custom={customDraft} t={t} />
      </section>

      <section className="look-controls">
        <div className="look-controls-head">
          <div>
            <span>{t('custom')}</span>
            <h4>{t('motifStudio')}</h4>
          </div>
          <div className="look-actions">
            <button className="btn sm ghost" type="button" onClick={onRandomize}>{t('shuffle')}</button>
            <button className="btn sm ghost" type="button" onClick={onReset}>{t('resetLook')}</button>
            <button className="btn sm ghost" type="button" disabled={!previewUrl} onClick={onPreview}>↗ {t('preview')}</button>
            <button className="btn sm" type="button" disabled={saving} onClick={onCustomSave}>{t('saveLook')}</button>
          </div>
        </div>

        <div className="look-control-block look-motif-block">
          <div className="look-control-title">{t('motif')}</div>
          <div className="look-motif-row">
            {MOTIF_OPTIONS.map((motif) => (
              <button className={customDraft.motif === motif ? 'on' : ''} key={motif} type="button" onClick={() => onCustomChange({ ...customDraft, motif })}>
                <span>{MOTIF_MARKS[motif]}</span>
                <b>{t('mt_' + motif)}</b>
              </button>
            ))}
          </div>
          <label className="look-range">
            <span>{t('motifOpacity')}</span>
            <input
              type="range"
              min="0.04"
              max="0.3"
              step="0.01"
              disabled={customDraft.motif === 'none'}
              value={customDraft.motifOpacity}
              onChange={(e) => onCustomChange({ ...customDraft, motifOpacity: Number(e.target.value) })}
            />
          </label>
        </div>

        <div className="look-control-block">
          <div className="look-control-title">{t('colorStudio')}</div>
          <div className="look-colors">
            {CUSTOM_FIELDS.map((field) => (
              <label className="look-color" key={field.key}>
                <input
                  type="color"
                  value={customDraft[field.key]}
                  onChange={(e) => onCustomChange({ ...customDraft, [field.key]: e.target.value })}
                />
                <span className="look-color-chip" style={{ background: customDraft[field.key] }} />
                <span>{t(field.label)}</span>
              </label>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniMenuPreview({ custom, t }: { custom: MenuThemeCustom; t: (k: string) => string }) {
  const style = customThemeVars(custom);

  return (
    <div className="look-preview">
      <div className="look-preview-title">{t('phonePreview')}</div>
      <div className="look-phone" style={style as CSSProperties}>
        <div className="look-phead">
          <div className="look-pmark">ق</div>
          <div>
            <b>{t('lookTitle')}</b>
            <span>Serva.</span>
          </div>
        </div>
        <div className="look-pnav">
          <span className="on">{t('sampleCat')}<em>6</em></span>
          <span>{t('sampleCat2')}<em>3</em></span>
          <span>{t('sampleCat3')}<em>4</em></span>
        </div>
        <div className="look-pitems">
          <div className="look-psection">{t('sampleCat')}</div>
          <div className="look-pitem">
            <div className="look-pthumb">ق</div>
            <div><b>{t('sampleItem')}</b><span>{t('sampleDesc')}</span></div>
            <strong>{t('samplePrice')}</strong>
          </div>
          <div className="look-pitem compact">
            <div className="look-pthumb alt">ك</div>
            <div><b>{t('sampleItem3')}</b><span>{t('sampleDesc3')}</span></div>
            <strong>١.٢٠</strong>
          </div>
          <div className="look-pitem compact">
            <div className="look-pthumb alt">ب</div>
            <div><b>{t('sampleItem5')}</b><span>{t('sampleCat')}</span></div>
            <strong>٢.١٠</strong>
          </div>
          <div className="look-psection">{t('sampleCat2')}</div>
          <div className="look-pitem compact">
            <div className="look-pthumb alt">ت</div>
            <div><b>{t('sampleItem2')}</b><span>{t('sampleDesc2')}</span></div>
            <strong>١.٨٠</strong>
          </div>
          <div className="look-pitem compact">
            <div className="look-pthumb alt">ز</div>
            <div><b>{t('sampleItem4')}</b><span>{t('sampleCat3')}</span></div>
            <strong>١.٦٠</strong>
          </div>
        </div>
        <div className="look-pcart">
          <span>{t('viewCart')}</span>
          <strong>{t('samplePrice')}</strong>
        </div>
      </div>
    </div>
  );
}

// Hand-tuned, legible palettes. "Quick mix" picks one of these and only varies the
// accent hue a little plus the motif/background — so the text/background pairing is
// always a designed, readable combination instead of a random (often muddy) one.
type PaletteRecipe = Pick<MenuThemeCustom, 'paper' | 'surface' | 'text' | 'muted' | 'accent' | 'accent2' | 'cartBg'>;

const PALETTE_RECIPES: PaletteRecipe[] = [
  { paper: '#FBF5EC', surface: '#F1E3D1', text: '#2C1B12', muted: '#7A5B45', accent: '#C8862B', accent2: '#A8531C', cartBg: '#2B1A12' }, // warm café
  { paper: '#F2F8F2', surface: '#DEEEE2', text: '#143F2B', muted: '#4C7059', accent: '#2FBF71', accent2: '#2E9BD8', cartBg: '#103923' }, // fresh mint
  { paper: '#FFF1F4', surface: '#FBDFE7', text: '#5A2233', muted: '#8C5366', accent: '#FF5C89', accent2: '#FF9F3D', cartBg: '#4B1730' }, // sweet rose
  { paper: '#F1F6F4', surface: '#DCEAE6', text: '#0B3B47', muted: '#4F6F75', accent: '#1F8FA6', accent2: '#E2674A', cartBg: '#07333D' }, // coastal teal
  { paper: '#FBEEE0', surface: '#F2DBC4', text: '#4A1C0E', muted: '#7F523D', accent: '#D7521E', accent2: '#E8A23D', cartBg: '#3C160B' }, // souq spice
  { paper: '#F7F2E6', surface: '#E8E2CC', text: '#213B24', muted: '#5C6B45', accent: '#6D8C3B', accent2: '#C8833A', cartBg: '#213B24' }, // garden olive
  { paper: '#EEF6F8', surface: '#DBE9EE', text: '#123846', muted: '#516F7B', accent: '#227D9A', accent2: '#E0A43B', cartBg: '#123846' }, // tile blue
  { paper: '#F5F2FB', surface: '#E7E0F4', text: '#2E2247', muted: '#675B82', accent: '#7C5CD8', accent2: '#E08BB8', cartBg: '#241A3C' }, // lavender
  { paper: '#F0F6FB', surface: '#DDE9F3', text: '#15324A', muted: '#566F84', accent: '#2E86C8', accent2: '#F2A33C', cartBg: '#122A40' }, // sky citrus
  { paper: '#15120D', surface: '#241D14', text: '#F3ECDD', muted: '#B6A888', accent: '#D4AF6C', accent2: '#B07A36', cartBg: '#F0D89E' }, // dark gold
  { paper: '#10251E', surface: '#1B342B', text: '#F2E8D0', muted: '#A6BBAD', accent: '#C79A43', accent2: '#2EA37A', cartBg: '#F2E8D0' }, // dark emerald
  { paper: '#101417', surface: '#1A2024', text: '#EAF7F6', muted: '#9FB2B5', accent: '#32D6C8', accent2: '#FF6D9E', cartBg: '#EAF7F6' }, // neon night
  { paper: '#0E0F12', surface: '#1A1D22', text: '#F3F5F0', muted: '#A6ADA9', accent: '#10B981', accent2: '#34D399', cartBg: '#F3F5F0' }, // onyx green
];

function randomCustomTheme(current: MenuThemeCustom): MenuThemeCustom {
  // avoid landing on the same palette twice in a row
  const pool = PALETTE_RECIPES.filter((r) => r.paper.toLowerCase() !== current.paper.toLowerCase());
  const recipe = (pool.length ? pool : PALETTE_RECIPES)[Math.floor(Math.random() * (pool.length ? pool.length : PALETTE_RECIPES.length))];
  const shift = Math.floor(Math.random() * 26) - 13; // ±13° keeps the accents harmonious but fresh
  const accent = rotateHue(recipe.accent, shift);
  const accent2 = rotateHue(recipe.accent2, shift);
  const motif = MOTIF_OPTIONS[1 + Math.floor(Math.random() * (MOTIF_OPTIONS.length - 1))];
  return {
    ...current,
    canvas: recipe.paper,
    paper: recipe.paper,
    surface: recipe.surface,
    text: ensureContrast(recipe.text, recipe.paper, 7),     // body text — guarantee strong legibility
    muted: ensureContrast(recipe.muted, recipe.paper, 3.4), // secondary text — keep it readable too
    accent,
    accent2,
    motif,
    motifColor: Math.random() > 0.4 ? accent : accent2,
    motifOpacity: Number((0.1 + Math.random() * 0.12).toFixed(2)),
    cartBg: recipe.cartBg,
  };
}

// Push a foreground colour away from the background until it clears a WCAG contrast
// ratio, so even an edited recipe can never produce unreadable text.
function ensureContrast(fg: string, bg: string, min: number): string {
  if (contrastRatio(fg, bg) >= min) return fg;
  const { h, s } = hexToHsl(fg);
  const darkBg = relLuminance(bg) < 0.4;
  for (let i = 0; i <= 100; i += 4) {
    const cand = hslToHex(h, s, darkBg ? i : 100 - i); // dark bg → lighten fg; light bg → darken fg
    if (contrastRatio(cand, bg) >= min) return cand;
  }
  return darkBg ? '#FFFFFF' : '#0B0B0B';
}

function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function relLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const lin = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * lin(parseInt(clean.slice(0, 2), 16)) + 0.7152 * lin(parseInt(clean.slice(2, 4), 16)) + 0.0722 * lin(parseInt(clean.slice(4, 6), 16));
}

function rotateHue(hex: string, deg: number): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex((h + deg + 360) % 360, s, l);
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0; let g = 0; let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return `#${toHex255((r + m) * 255)}${toHex255((g + m) * 255)}${toHex255((b + m) * 255)}`;
}

function toHex255(value: number): string {
  return Math.round(value).toString(16).padStart(2, '0');
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
