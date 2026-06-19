/* Bulk menu JSON import — shared parsing/normalising used by the platform admin's
 * per-café "Import menu (JSON)" tool. Pasting a whole menu REPLACES the café's
 * current one (delete then recreate) through the same validated menu endpoints.
 * Photos are intentionally out of scope (added manually).
 *
 * Accepted shape (a bare array of categories is also accepted):
 *   { "categories": [ {
 *       "nameEn", "nameAr", "descriptionEn"?, "descriptionAr"?,
 *       "items": [ {
 *         "nameEn", "nameAr", "descriptionEn"?, "descriptionAr"?,
 *         "price", "preparationTimeMinutes"?, "available"?,
 *         "options"?: [ { "nameEn", "nameAr", "selectionType"? ("SINGLE"|"MULTI"),
 *                         "required"?, "choices": [ { "nameEn", "nameAr", "priceDelta"? } ] } ]
 *       } ]
 *   } ] }
 */

export type ImpOpt = { nameEn: string; nameAr: string; priceDelta?: number };
export type ImpGroup = { nameEn: string; nameAr: string; selectionType?: string; required?: boolean; choices?: ImpOpt[]; options?: ImpOpt[] };
export type ImpItem = { nameEn: string; nameAr: string; descriptionEn?: string; descriptionAr?: string; price: number; preparationTimeMinutes?: number; available?: boolean; options?: ImpGroup[] };
export type ImpCat = { nameEn: string; nameAr: string; descriptionEn?: string; descriptionAr?: string; items?: ImpItem[] };

export const IMPORT_SAMPLE = `{
  "categories": [
    {
      "nameEn": "Hot Drinks",
      "nameAr": "مشروبات ساخنة",
      "items": [
        {
          "nameEn": "Latte",
          "nameAr": "لاتيه",
          "descriptionEn": "Espresso with steamed milk",
          "descriptionAr": "إسبريسو مع حليب مبخّر",
          "price": 1.500,
          "preparationTimeMinutes": 5,
          "available": true,
          "options": [
            {
              "nameEn": "Size", "nameAr": "الحجم",
              "selectionType": "SINGLE", "required": true,
              "choices": [
                { "nameEn": "Small", "nameAr": "صغير", "priceDelta": 0 },
                { "nameEn": "Large", "nameAr": "كبير", "priceDelta": 0.300 }
              ]
            }
          ]
        }
      ]
    }
  ]
}`;

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Validate + normalise pasted JSON. Returns the clean category list or a list of problems. */
export function parseImport(text: string): { cats: ImpCat[] } | { errors: string[] } {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { errors: ['Invalid JSON syntax'] }; }
  const list = Array.isArray(raw) ? raw : (raw as { categories?: unknown })?.categories;
  if (!Array.isArray(list)) return { errors: ['Expected an object with a "categories" array (or a bare array of categories).'] };

  const errors: string[] = [];
  const cats: ImpCat[] = [];
  list.forEach((c, ci) => {
    const cat = c as Record<string, unknown>;
    const nameEn = str(cat.nameEn), nameAr = str(cat.nameAr);
    const where = `categories[${ci}]${nameEn ? ` "${nameEn}"` : ''}`;
    if (!nameEn) errors.push(`${where}: nameEn is required`);
    if (!nameAr) errors.push(`${where}: nameAr is required`);
    const rawItems = Array.isArray(cat.items) ? cat.items : [];
    const items: ImpItem[] = [];
    rawItems.forEach((i, ii) => {
      const it = i as Record<string, unknown>;
      const inEn = str(it.nameEn), inAr = str(it.nameAr);
      const iwhere = `${where} › items[${ii}]${inEn ? ` "${inEn}"` : ''}`;
      const price = typeof it.price === 'number' ? it.price : Number(it.price);
      if (!inEn) errors.push(`${iwhere}: nameEn is required`);
      if (!inAr) errors.push(`${iwhere}: nameAr is required`);
      if (!(price > 0)) errors.push(`${iwhere}: price must be a number > 0`);
      const groups = Array.isArray(it.options) ? (it.options as ImpGroup[]) : undefined;
      items.push({
        nameEn: inEn, nameAr: inAr,
        descriptionEn: str(it.descriptionEn) || undefined, descriptionAr: str(it.descriptionAr) || undefined,
        price, preparationTimeMinutes: typeof it.preparationTimeMinutes === 'number' ? it.preparationTimeMinutes : undefined,
        available: typeof it.available === 'boolean' ? it.available : undefined, options: groups,
      });
    });
    cats.push({
      nameEn, nameAr,
      descriptionEn: str(cat.descriptionEn) || undefined, descriptionAr: str(cat.descriptionAr) || undefined,
      items,
    });
  });
  if (!cats.length) errors.push('No categories found');
  return errors.length ? { errors } : { cats };
}

/** Map the loose import option groups onto the backend's optionGroups payload, dropping empties. */
export function normalizeGroups(groups?: ImpGroup[]) {
  if (!Array.isArray(groups)) return [];
  return groups
    .map((g, gi) => {
      const choices = (g.choices ?? g.options ?? []).filter((o) => str(o.nameEn) && str(o.nameAr));
      if (!str(g.nameEn) || !str(g.nameAr) || !choices.length) return null;
      return {
        nameEn: str(g.nameEn), nameAr: str(g.nameAr),
        selectionType: String(g.selectionType).toUpperCase() === 'MULTI' ? 'MULTI' : 'SINGLE',
        required: !!g.required, displayOrder: gi,
        options: choices.map((o, oi) => ({
          nameEn: str(o.nameEn), nameAr: str(o.nameAr),
          priceDelta: typeof o.priceDelta === 'number' ? o.priceDelta : Number(o.priceDelta) || 0,
          displayOrder: oi,
        })),
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);
}
