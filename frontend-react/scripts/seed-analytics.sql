-- =====================================================================
-- seed-analytics.sql — rich ~8-week demo dataset for the Mutrah Coffee
-- analytics page (orders, items, staff events, item views, customers,
-- and neighbour cafés for benchmarking).
--
-- The REST API can't backdate created_at, and analytics buckets by it,
-- so we generate straight into Postgres. Idempotent: every row it makes
-- is tagged and cleared on re-run.
--
--   docker exec -i cafeqr-db psql -U cafeqr -d cafeqr < scripts/seed-analytics.sql
-- =====================================================================
SET client_min_messages = notice;

DO $$
DECLARE
  r_id        bigint;
  vatr        numeric;
  branch_ids  bigint[];
  tbl1        bigint;
  owner_pw    text;
  mi_ids      bigint[];
  mi_en       text[];
  mi_ar       text[];
  mi_price    numeric[];
  weight_pool int[] := ARRAY[]::int[];
  item_w      int[]  := ARRAY[6,2,2,7,12,5,6,5,4];      -- per menu position (Karak#5 top; V60#2 & Iced#3 weak)
  conv_tgt    numeric[] := ARRAY[0.45,0.14,0.12,0.55,0.70,0.40,0.50,0.45,0.35];
  staff_ids   bigint[] := ARRAY[]::bigint[];
  staff_names text[] := ARRAY['سالم البلوشي','مريم الهنائي','أحمد الزدجالي'];
  staff_lat   int[]  := ARRAY[35, 70, 120];             -- avg accept latency (s) per staff
  cust_names  text[] := ARRAY['ريم','يوسف','هلال','فاطمة','بدر','نورة','سيف','خالد','عائشة','مازن','جمال','منى','طارق','شيخة','حمد','ليلى','ماجد','زينب','راشد','أسماء','علي','دانة'];
  uid         bigint;
  d int; i int; k int; n_orders int;
  the_date date; loc_ts timestamp; ts timestamptz;
  dow int; wd numeric; trend numeric; hh int;
  picks int[]; qtys int[]; mi_pos int; qty int; npicks int;
  subtotal numeric; vat numeric; total numeric; line numeric;
  o_id bigint; o_status text; o_branch bigint; o_type text; o_pay text;
  acc timestamptz; prep_t timestamptz; rdy timestamptz; comp timestamptz; dec_t timestamptz; can_t timestamptz;
  s_idx int; lat int; prep_min int; cust text; phone text;
  view_qty bigint; nviews int;
  neigh int; nr_id bigint; nb_id bigint; ns_id bigint; naov numeric; nlat int;
BEGIN
  SELECT id, restaurants.vat_rate INTO r_id, vatr FROM restaurants WHERE slug = 'mutrah-coffee';
  IF r_id IS NULL THEN RAISE EXCEPTION 'mutrah-coffee not found — run `node scripts/seed.mjs` first'; END IF;
  UPDATE restaurants SET plan = 'PRO' WHERE id = r_id;

  SELECT array_agg(id ORDER BY id) INTO branch_ids FROM branches WHERE restaurant_id = r_id;
  SELECT id INTO tbl1 FROM restaurant_tables WHERE restaurant_id = r_id ORDER BY id LIMIT 1;
  SELECT password_hash INTO owner_pw FROM users WHERE email = 'owner@mutrah.coffee';
  SELECT array_agg(id ORDER BY id), array_agg(name_en ORDER BY id),
         array_agg(name_ar ORDER BY id), array_agg(price ORDER BY id)
    INTO mi_ids, mi_en, mi_ar, mi_price
    FROM menu_items WHERE restaurant_id = r_id;

  -- ---------- clear previously-seeded synthetic rows ----------
  DELETE FROM order_events WHERE order_id IN (SELECT id FROM orders WHERE internal_note = 'seed:analytics');
  DELETE FROM orders            WHERE internal_note = 'seed:analytics';
  DELETE FROM analytics_events  WHERE session_token LIKE 'seed-%';
  DELETE FROM customer_profiles WHERE device_token LIKE 'seed-%';
  DELETE FROM users             WHERE username LIKE 'seed-%';
  DELETE FROM branches          WHERE restaurant_id IN (SELECT id FROM restaurants WHERE slug LIKE 'seed-neighbor-%');
  DELETE FROM restaurants       WHERE slug LIKE 'seed-neighbor-%';

  -- ---------- staff users (for the leaderboard + accept-latency) ----------
  FOR i IN 1..array_length(staff_names, 1) LOOP
    INSERT INTO users(full_name, password_hash, restaurant_id, active, created_at, updated_at, username, owner)
    VALUES (staff_names[i], owner_pw, r_id, true, now(), now(), 'seed-staff-' || i || '-' || substr(md5(random()::text),1,6), false)
    RETURNING id INTO uid;
    staff_ids := array_append(staff_ids, uid);
  END LOOP;

  -- ---------- weighted item pool ----------
  FOR i IN 1..9 LOOP
    FOR k IN 1..item_w[i] LOOP weight_pool := array_append(weight_pool, i); END LOOP;
  END LOOP;

  -- ---------- orders across the last 56 days ----------
  FOR d IN 0..55 LOOP
    the_date := (now() AT TIME ZONE 'Asia/Muscat')::date - d;
    dow  := EXTRACT(ISODOW FROM the_date)::int;                       -- 1=Mon … 7=Sun
    wd   := (ARRAY[0.90,0.85,0.95,1.15,1.35,1.40,1.00])[dow];         -- Thu/Fri/Sat busy
    trend := 1.0 + ((55 - d)::numeric / 55.0) * 0.45;                 -- gentle growth toward today
    n_orders := greatest(3, round(26 * wd * trend * (0.85 + random()*0.30)))::int;

    FOR i IN 1..n_orders LOOP
      hh := (ARRAY[7,8,8,9,9,9,10,10,11,12,12,13,14,15,16,17,18,19,19,20,20,20,21,21,22,23])[1 + floor(random()*26)::int];
      loc_ts := make_timestamp(EXTRACT(YEAR FROM the_date)::int, EXTRACT(MONTH FROM the_date)::int,
                               EXTRACT(DAY FROM the_date)::int, hh, floor(random()*60)::int, 0);
      ts := loc_ts AT TIME ZONE 'Asia/Muscat';
      IF ts > now() THEN ts := now() - (random()*2400) * interval '1 second'; END IF;

      o_branch := branch_ids[1 + floor(random()*array_length(branch_ids,1))::int];
      IF d = 0 THEN
        o_status := (ARRAY['COMPLETED','COMPLETED','COMPLETED','COMPLETED','READY','ACCEPTED','ACCEPTED','PENDING','CANCELLED'])[1 + floor(random()*9)::int];
      ELSE
        o_status := (ARRAY['COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','COMPLETED','CANCELLED','CANCELLED'])[1 + floor(random()*18)::int];
      END IF;
      o_type := CASE WHEN random() < 0.70 THEN 'DINE_IN' ELSE 'CAR' END;
      o_pay  := CASE WHEN o_status = 'COMPLETED' THEN 'PAID' ELSE 'UNPAID' END;
      cust   := cust_names[1 + floor(random()*array_length(cust_names,1))::int];
      phone  := '+9689' || lpad(floor(random()*10000000)::text, 7, '0');

      s_idx := 1 + floor(random() * (CASE WHEN random() < 0.6 THEN 1 ELSE 3 END))::int;
      IF s_idx > 3 THEN s_idx := 3; END IF;
      lat := greatest(8, staff_lat[s_idx] + floor(random()*40)::int - 20);
      prep_min := 4 + floor(random()*8)::int;

      acc := NULL; prep_t := NULL; rdy := NULL; comp := NULL; dec_t := NULL; can_t := NULL;
      IF o_status IN ('ACCEPTED','PREPARING','READY','COMPLETED') THEN acc := ts + lat * interval '1 second'; END IF;
      IF o_status IN ('PREPARING','READY','COMPLETED')           THEN prep_t := acc + interval '40 seconds'; END IF;
      IF o_status IN ('READY','COMPLETED')                       THEN rdy := prep_t + prep_min * interval '1 minute'; END IF;
      IF o_status = 'COMPLETED'                                  THEN comp := rdy + (60 + floor(random()*240)) * interval '1 second'; END IF;
      IF o_status = 'DECLINED'                                   THEN dec_t := ts + lat * interval '1 second'; END IF;
      IF o_status = 'CANCELLED'                                  THEN can_t := ts + (120 + floor(random()*300)) * interval '1 second'; END IF;

      -- pick distinct items, then add affinity partners
      picks := ARRAY[]::int[];
      npicks := (ARRAY[1,1,2,2,2,3,3,4])[1 + floor(random()*8)::int];
      WHILE coalesce(array_length(picks,1),0) < npicks LOOP
        mi_pos := weight_pool[1 + floor(random()*array_length(weight_pool,1))::int];
        IF NOT (mi_pos = ANY(picks)) THEN picks := array_append(picks, mi_pos); END IF;
      END LOOP;
      IF 5 = ANY(picks) AND random() < 0.8 AND NOT (7 = ANY(picks)) THEN picks := array_append(picks, 7); END IF;
      IF 1 = ANY(picks) AND random() < 0.6 AND NOT (8 = ANY(picks)) THEN picks := array_append(picks, 8); END IF;
      IF 4 = ANY(picks) AND random() < 0.5 AND NOT (9 = ANY(picks)) THEN picks := array_append(picks, 9); END IF;

      qtys := ARRAY[]::int[];
      subtotal := 0;
      FOREACH mi_pos IN ARRAY picks LOOP
        qty := CASE WHEN mi_pos = 5 THEN 1 + floor(random()*3)::int ELSE 1 + floor(random()*2)::int END;
        qtys := array_append(qtys, qty);
        subtotal := subtotal + mi_price[mi_pos] * qty;
      END LOOP;
      vat := round(subtotal * vatr / 100.0, 3);
      total := subtotal + vat;

      INSERT INTO orders(order_number, tracking_token, restaurant_id, branch_id, table_id, customer_name, customer_phone,
        order_type, status, payment_status, subtotal, vat_amount, total, prep_time_minutes, internal_note,
        created_at, accepted_at, declined_at, preparing_at, ready_at, completed_at, cancelled_at, updated_at, car_plate, car_color)
      VALUES ('A' || nextval('order_number_seq'), replace(gen_random_uuid()::text,'-',''), r_id, o_branch,
        CASE WHEN o_branch = branch_ids[1] THEN tbl1 ELSE NULL END, cust, phone,
        o_type, o_status, o_pay, subtotal, vat, total, prep_min, 'seed:analytics',
        ts, acc, dec_t, prep_t, rdy, comp, can_t, coalesce(comp, rdy, prep_t, acc, can_t, dec_t, ts),
        CASE WHEN o_type = 'CAR' THEN (ARRAY['12345','AB1234','77889','OM5521'])[1 + floor(random()*4)::int] ELSE NULL END,
        CASE WHEN o_type = 'CAR' THEN (ARRAY['أبيض','أسود','فضي','رمادي'])[1 + floor(random()*4)::int] ELSE NULL END)
      RETURNING id INTO o_id;

      FOR k IN 1..array_length(picks,1) LOOP
        mi_pos := picks[k]; qty := qtys[k]; line := mi_price[mi_pos] * qty;
        INSERT INTO order_items(order_id, menu_item_id, name_en_snapshot, name_ar_snapshot, price_snapshot, quantity, line_total)
        VALUES (o_id, mi_ids[mi_pos], mi_en[mi_pos], mi_ar[mi_pos], mi_price[mi_pos], qty, line);
      END LOOP;

      IF acc   IS NOT NULL THEN INSERT INTO order_events(order_id, restaurant_id, branch_id, event_type, actor_user_id, actor_name, created_at) VALUES (o_id, r_id, o_branch, 'ACCEPTED',  staff_ids[s_idx], staff_names[s_idx], acc);   END IF;
      IF comp  IS NOT NULL THEN INSERT INTO order_events(order_id, restaurant_id, branch_id, event_type, actor_user_id, actor_name, created_at) VALUES (o_id, r_id, o_branch, 'COMPLETED', staff_ids[s_idx], staff_names[s_idx], comp);  END IF;
      IF dec_t IS NOT NULL THEN INSERT INTO order_events(order_id, restaurant_id, branch_id, event_type, actor_user_id, actor_name, created_at) VALUES (o_id, r_id, o_branch, 'DECLINED',  staff_ids[s_idx], staff_names[s_idx], dec_t); END IF;
    END LOOP;
  END LOOP;

  -- ---------- item views (drive the conversion radar) ----------
  FOR mi_pos IN 1..array_length(mi_ids,1) LOOP
    SELECT coalesce(sum(quantity),0) INTO view_qty
      FROM order_items
     WHERE menu_item_id = mi_ids[mi_pos]
       AND order_id IN (SELECT id FROM orders WHERE internal_note = 'seed:analytics' AND restaurant_id = r_id);
    nviews := ceil(view_qty / conv_tgt[mi_pos])::int;
    IF nviews > 0 THEN
      INSERT INTO analytics_events(restaurant_id, branch_id, device_token, session_token, event_type, menu_item_id, created_at)
      SELECT r_id,
             branch_ids[1 + floor(random()*array_length(branch_ids,1))::int],
             'seed-dev-' || floor(random()*400)::int,
             'seed-view', 'ITEM_VIEW', mi_ids[mi_pos],
             now() - (random()*56) * interval '1 day'
      FROM generate_series(1, nviews);
    END IF;
  END LOOP;

  -- ---------- funnel sessions (menu view → add to cart → checkout) ----------
  FOR d IN 0..55 LOOP
    the_date := (now() AT TIME ZONE 'Asia/Muscat')::date - d;
    dow := EXTRACT(ISODOW FROM the_date)::int;
    wd := (ARRAY[0.90,0.85,0.95,1.15,1.35,1.40,1.00])[dow];
    trend := 1.0 + ((55 - d)::numeric / 55.0) * 0.45;
    n_orders := greatest(8, round(80 * wd * trend * (0.85 + random()*0.30)))::int;   -- sessions that day
    FOR k IN 1..n_orders LOOP
      hh := (ARRAY[7,8,8,9,9,9,10,10,11,12,12,13,14,15,16,17,18,19,19,20,20,20,21,21,22,23])[1 + floor(random()*26)::int];
      ts := make_timestamp(EXTRACT(YEAR FROM the_date)::int, EXTRACT(MONTH FROM the_date)::int, EXTRACT(DAY FROM the_date)::int, hh, floor(random()*60)::int, 0) AT TIME ZONE 'Asia/Muscat';
      IF ts > now() THEN ts := now() - (random()*2400) * interval '1 second'; END IF;
      o_branch := branch_ids[1 + floor(random()*array_length(branch_ids,1))::int];
      INSERT INTO analytics_events(restaurant_id, branch_id, device_token, session_token, event_type, created_at)
        VALUES (r_id, o_branch, 'seed-dev-' || floor(random()*4000)::int, 'seed-s-' || d || '-' || k, 'MENU_VIEW', ts);
      IF random() < 0.60 THEN
        INSERT INTO analytics_events(restaurant_id, branch_id, device_token, session_token, event_type, created_at)
          VALUES (r_id, o_branch, 'seed-dev-' || floor(random()*4000)::int, 'seed-s-' || d || '-' || k, 'ADD_TO_CART', ts + interval '40 seconds');
        IF random() < 0.72 THEN
          INSERT INTO analytics_events(restaurant_id, branch_id, device_token, session_token, event_type, created_at)
            VALUES (r_id, o_branch, 'seed-dev-' || floor(random()*4000)::int, 'seed-s-' || d || '-' || k, 'CHECKOUT_STARTED', ts + interval '90 seconds');
          IF random() < 0.70 THEN
            INSERT INTO analytics_events(restaurant_id, branch_id, device_token, session_token, event_type, created_at)
              VALUES (r_id, o_branch, 'seed-dev-' || floor(random()*4000)::int, 'seed-s-' || d || '-' || k, 'ORDER_PLACED', ts + interval '150 seconds');
          END IF;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  -- ---------- customer profiles (regulars + at-risk) ----------
  FOR i IN 1..22 LOOP
    cust := cust_names[1 + ((i - 1) % array_length(cust_names,1))];
    IF i <= 6 THEN        k := 8 + floor(random()*22)::int; ts := now() - (random()*6) * interval '1 day';            -- loyal & recent
    ELSIF i <= 11 THEN    k := 3 + floor(random()*7)::int;  ts := now() - (24 + random()*20) * interval '1 day';      -- 3+ weeks quiet
    ELSE                  k := 1 + floor(random()*4)::int;  ts := now() - (random()*15) * interval '1 day';           -- casual
    END IF;
    INSERT INTO customer_profiles(restaurant_id, device_token, customer_name, customer_phone, order_count, last_order_at, created_at, updated_at)
    VALUES (r_id, 'seed-' || i || '-' || substr(md5(random()::text),1,8), cust,
            '+9689' || lpad((1000000 + i)::text, 7, '0'), k, ts, now() - interval '60 days', now());
  END LOOP;

  -- ---------- neighbour cafés (so the anonymous benchmark has a cohort) ----------
  FOR neigh IN 1..6 LOOP
    INSERT INTO restaurants(name, slug, currency, vat_enabled, vat_rate, active, plan, created_at, updated_at)
    VALUES ('Neighbour ' || neigh, 'seed-neighbor-' || neigh, 'OMR', true, 5, true, 'PRO', now(), now()) RETURNING id INTO nr_id;
    INSERT INTO branches(restaurant_id, name, active, created_at, updated_at)
    VALUES (nr_id, 'Main', true, now(), now()) RETURNING id INTO nb_id;
    INSERT INTO users(full_name, password_hash, restaurant_id, active, created_at, updated_at, username, owner)
    VALUES ('Neighbour Staff ' || neigh, owner_pw, nr_id, true, now(), now(), 'seed-neighbor-staff-' || neigh, false) RETURNING id INTO ns_id;
    naov := 0.80 + neigh * 0.25;   -- AOVs spread 1.05 … 2.30 so Mutrah ranks somewhere in the middle
    nlat := 30 + neigh * 18;       -- accept latencies 48 … 138s
    FOR i IN 1..25 LOOP
      ts := now() - (random()*28) * interval '1 day' - (random()*12) * interval '1 hour';
      total := round((naov * (0.7 + random()*0.6))::numeric, 3);
      INSERT INTO orders(order_number, tracking_token, restaurant_id, branch_id, order_type, status, payment_status,
        subtotal, vat_amount, total, prep_time_minutes, internal_note, created_at, accepted_at, completed_at, updated_at)
      VALUES ('N' || nextval('order_number_seq'), replace(gen_random_uuid()::text,'-',''), nr_id, nb_id, 'DINE_IN', 'COMPLETED', 'PAID',
        round(total/1.05, 3), round(total - total/1.05, 3), total, 5, 'seed:analytics',
        ts, ts + nlat * interval '1 second', ts + interval '8 minutes', ts + interval '8 minutes')
      RETURNING id INTO o_id;
      INSERT INTO order_events(order_id, restaurant_id, branch_id, event_type, actor_user_id, actor_name, created_at)
      VALUES (o_id, nr_id, nb_id, 'ACCEPTED', ns_id, 'Neighbour Staff ' || neigh, ts + (nlat + floor(random()*30)::int - 15) * interval '1 second');
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Mutrah orders:    %', (SELECT count(*) FROM orders WHERE internal_note = 'seed:analytics' AND restaurant_id = r_id);
  RAISE NOTICE 'order items:      %', (SELECT count(*) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.internal_note = 'seed:analytics' AND o.restaurant_id = r_id);
  RAISE NOTICE 'item views:       %', (SELECT count(*) FROM analytics_events WHERE session_token = 'seed-view');
  RAISE NOTICE 'funnel sessions:  % views / % cart / % checkout / % ordered', (SELECT count(DISTINCT session_token) FROM analytics_events WHERE event_type='MENU_VIEW' AND session_token LIKE 'seed-s-%'), (SELECT count(DISTINCT session_token) FROM analytics_events WHERE event_type='ADD_TO_CART' AND session_token LIKE 'seed-s-%'), (SELECT count(DISTINCT session_token) FROM analytics_events WHERE event_type='CHECKOUT_STARTED' AND session_token LIKE 'seed-s-%'), (SELECT count(DISTINCT session_token) FROM analytics_events WHERE event_type='ORDER_PLACED' AND session_token LIKE 'seed-s-%');
  RAISE NOTICE 'staff events:     %', (SELECT count(*) FROM order_events WHERE restaurant_id = r_id AND actor_user_id = ANY(staff_ids));
  RAISE NOTICE 'customer profiles:%', (SELECT count(*) FROM customer_profiles WHERE device_token LIKE 'seed-%');
  RAISE NOTICE 'neighbour cafes:  %', (SELECT count(*) FROM restaurants WHERE slug LIKE 'seed-neighbor-%');
END $$;
