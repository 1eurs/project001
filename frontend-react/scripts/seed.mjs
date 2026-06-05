/**
 * Seeds demo data into the running CafeQR backend via the REAL API.
 * Idempotent: safe to run repeatedly. Requires the backend up on :8080
 * with the dev bootstrap admin (admin@cafeqr.local / Admin123!).
 *
 *   node scripts/seed.mjs
 */
const BASE = process.env.API_BASE || 'http://localhost:8080';

const ADMIN = { email: 'admin@cafeqr.local', password: 'Admin123!' };
const OWNER = { fullName: 'خالد البلوشي', email: 'owner@mutrah.coffee', password: 'Owner123!' };
const SLUG = 'mutrah-coffee';

let token = null;
async function api(path, { method = 'GET', body, auth = true } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const env = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, env };
}
const data = (r) => r.env?.data ?? r.env;
const code = (r) => r.env?.errorCode;

async function login(creds) {
  const r = await api('/api/auth/login', { method: 'POST', auth: false, body: creds });
  if (!r.ok) throw new Error('login failed: ' + JSON.stringify(r.env));
  token = data(r).accessToken;
  return data(r);
}

async function main() {
  // 1) Admin login -----------------------------------------------------------
  await login(ADMIN);
  console.log('✓ admin logged in');

  // 2) Restaurant (reuse if slug already exists) -----------------------------
  let restaurant;
  const create = await api('/api/admin/restaurants', {
    method: 'POST',
    body: { name: 'قهوة مطرح', slug: SLUG, phone: '+96890000001',
            currency: 'OMR', vatEnabled: true, vatRate: 5 },
  });
  if (create.ok) {
    restaurant = data(create);
    console.log('✓ restaurant created #' + restaurant.id);
  } else if (code(create) === 'SLUG_ALREADY_EXISTS' || create.status === 409) {
    const list = await api('/api/admin/restaurants');
    restaurant = (data(list).content || data(list)).find((x) => x.slug === SLUG);
    console.log('• restaurant already exists #' + restaurant.id);
  } else {
    throw new Error('restaurant create failed: ' + JSON.stringify(create.env));
  }

  // 3) Owner (ignore if email already exists) --------------------------------
  const owner = await api('/api/users', {
    method: 'POST',
    body: { fullName: OWNER.fullName, email: OWNER.email, password: OWNER.password,
            role: 'RESTAURANT_OWNER', restaurantId: restaurant.id },
  });
  if (owner.ok) console.log('✓ owner created');
  else if (code(owner) === 'EMAIL_ALREADY_EXISTS' || owner.status === 409) console.log('• owner already exists');
  else throw new Error('owner create failed: ' + JSON.stringify(owner.env));

  // 4) Act as the owner ------------------------------------------------------
  await login({ email: OWNER.email, password: OWNER.password });
  console.log('✓ owner logged in');

  // 5) Branch (reuse first) --------------------------------------------------
  let branch;
  const branches = await api(`/api/restaurants/${restaurant.id}/branches`);
  const blist = data(branches)?.content || data(branches) || [];
  if (blist.length) { branch = blist[0]; console.log('• branch exists #' + branch.id); }
  else {
    const b = await api(`/api/restaurants/${restaurant.id}/branches`, {
      method: 'POST',
      body: { name: 'فرع كورنيش مطرح', address: 'كورنيش مطرح، مسقط', phone: '+96824000000', openingHours: '7AM – 12AM' },
    });
    if (!b.ok) throw new Error('branch create failed: ' + JSON.stringify(b.env));
    branch = data(b); console.log('✓ branch created #' + branch.id);
  }

  // 6) Table (reuse first) ---------------------------------------------------
  let table;
  const tables = await api(`/api/branches/${branch.id}/tables`);
  const tlist = data(tables)?.content || data(tables) || [];
  if (tlist.length) { table = tlist[0]; console.log('• table exists #' + table.id); }
  else {
    const tcreate = await api(`/api/branches/${branch.id}/tables`, { method: 'POST', body: { tableNumber: '5' } });
    if (!tcreate.ok) throw new Error('table create failed: ' + JSON.stringify(tcreate.env));
    table = data(tcreate); console.log('✓ table created #' + table.id);
  }

  // 7) Menu (only if empty) --------------------------------------------------
  const existing = await api(`/api/menu/categories?restaurantId=${restaurant.id}`);
  const cats = data(existing)?.content || data(existing) || [];
  if (cats.length) {
    console.log('• menu already has ' + cats.length + ' categories — skipping');
  } else {
    const MENU = [
      { nameAr: 'قهوة مختصّة', nameEn: 'Specialty Coffee', descAr: 'حبوب محمّصة طازجة', descEn: 'Freshly roasted, single origin', items: [
        { nameAr: 'كورتادو', nameEn: 'Cortado', dAr: 'إسبريسو مزدوج بحليب مخملي', dEn: 'Double espresso, velvety milk', price: 1.300, prep: 4 },
        { nameAr: 'في60 يدوي', nameEn: 'V60 Pour-over', dAr: 'تقطير يدوي يُبرز نكهات الأصل', dEn: 'Hand-brewed, single origin clarity', price: 1.800, prep: 8 },
        { nameAr: 'آيس سبانيش لاتيه', nameEn: 'Iced Spanish Latte', dAr: 'إسبريسو مثلّج بحليب محلّى', dEn: 'Iced espresso, sweetened milk', price: 1.600, prep: 5, available: false },
      ]},
      { nameAr: 'قهوة عربية', nameEn: 'Arabic Coffee', descAr: 'على أصول الضيافة العُمانية', descEn: 'In the Omani way of hospitality', items: [
        { nameAr: 'قهوة بالهيل', nameEn: 'Cardamom Coffee', dAr: 'قهوة فاتحة بالهيل مع التمر', dEn: 'Light roast with cardamom, served with dates', price: 0.800, prep: 4 },
        { nameAr: 'كرك زعفران', nameEn: 'Saffron Karak', dAr: 'كرك بالزعفران والهيل وحليب مكثّف', dEn: 'Karak with saffron, cardamom & condensed milk', price: 0.500, prep: 5 },
        { nameAr: 'لاتيه باللبان', nameEn: 'Frankincense Latte', dAr: 'إسبريسو مع حليب معطّر باللبان', dEn: 'Espresso with frankincense-infused milk', price: 1.500, prep: 6 },
      ]},
      { nameAr: 'حلويات', nameEn: 'Sweets', descAr: 'من المطبخ العُماني وأكثر', descEn: 'From the Omani kitchen & beyond', items: [
        { nameAr: 'لقيمات بالدبس', nameEn: 'Luqaimat · Date Syrup', dAr: 'عجينة ذهبية مقرمشة بدبس التمر', dEn: 'Crisp golden dumplings, date molasses', price: 0.900, prep: 7 },
        { nameAr: 'حلوى عمانية', nameEn: 'Omani Halwa', dAr: 'بالزعفران والمكسرات وماء الورد', dEn: 'Saffron, nuts & rosewater', price: 0.700, prep: 2 },
        { nameAr: 'تمر بالقشطة', nameEn: 'Stuffed Dates & Cream', dAr: 'تمر خلاص محشو بالقشطة الطازجة', dEn: 'Khalas dates filled with fresh cream', price: 1.100, prep: 3 },
      ]},
    ];
    let order = 1;
    for (const c of MENU) {
      const cc = await api('/api/menu/categories', {
        method: 'POST',
        body: { restaurantId: restaurant.id, nameEn: c.nameEn, nameAr: c.nameAr,
                descriptionEn: c.descEn, descriptionAr: c.descAr, displayOrder: order++ },
      });
      if (!cc.ok) throw new Error('category failed: ' + JSON.stringify(cc.env));
      const catId = data(cc).id;
      let io = 1;
      for (const it of c.items) {
        const ii = await api('/api/menu/items', {
          method: 'POST',
          body: { restaurantId: restaurant.id, categoryId: catId, nameEn: it.nameEn, nameAr: it.nameAr,
                  descriptionEn: it.dEn, descriptionAr: it.dAr, price: it.price,
                  available: it.available !== false, preparationTimeMinutes: it.prep, displayOrder: io++ },
        });
        if (!ii.ok) throw new Error('item failed: ' + JSON.stringify(ii.env));
      }
      console.log(`✓ category "${c.nameEn}" + ${c.items.length} items`);
    }
  }

  // 8) Summary ---------------------------------------------------------------
  console.log('\n──────────── DEMO DATA READY ────────────');
  console.log('Restaurant slug : ' + restaurant.slug);
  console.log('Branch id       : ' + branch.id);
  console.log('Table token     : ' + table.qrCodeToken);
  console.log('Owner login     : ' + OWNER.email + ' / ' + OWNER.password);
  console.log('Admin login     : ' + ADMIN.email + ' / ' + ADMIN.password);
  console.log('Customer URL    : /r/' + restaurant.slug + '/b/' + branch.id + '/t/' + table.qrCodeToken);
  console.log('Public menu API : ' + BASE + '/api/public/qr/' + table.qrCodeToken + '/menu');
  // emit machine-readable line for tooling
  console.log('SEED_JSON=' + JSON.stringify({ slug: restaurant.slug, branchId: branch.id, tableToken: table.qrCodeToken }));
}

main().catch((e) => { console.error('✗ seed error:', e.message); process.exit(1); });
