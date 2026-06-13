import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { useI18n, useT, type Dict } from '../../lib/i18n';
import { BRAND } from '../../lib/brand';
import { DEMO } from '../../lib/demo';
import './site.css';

const T: Dict = {
  ar: {
    nav_how: 'كيف يعمل', nav_feat: 'المزايا', nav_price: 'السعر', nav_demo: 'العرض', nav_req: 'ابدأ', nav_signin: 'دخول', cta_start: 'ابدأ الآن',
    kicker: 'الطابور ينتهي هنا.',
    h1a: 'اطلب من', h1b: 'أي مكان', trans: 'Order from anywhere.',
    sub: 'من الطاولة، أو الكاونتر، أو السيارة.',
    lead: 'للمقاهي والمطاعم في عُمان. يمسح زبونك الرمز من طاولته أو من الطابور أو من سيارته، يتصفّح القائمة بالعربية أو الإنجليزية، ويطلب خلال ثوانٍ — دون تطبيق، ودون انتظار، ودون التلويح للنادل.',
    cta_req: 'ابدأ استقبال الطلبات', cta_demo: 'شاهده يعمل', sl_scan: 'امسح', sl_order: 'اطلب', sl_track: 'استلم',
    prob_lbl: 'المشكلة',
    m1: 'طابور عند الكاونتر، وتلويح للنادل، وسيارات تنتظر في الخارج —', m2: 'كلها الاختناق نفسه.',
    ba_before: 'ساعة الذروة بدون Serva',
    bb1: 'طابور عند الكاشير، وزبائن ينسحبون منه.',
    bb2: 'زبائن يلوّحون لنادلٍ يقوم بثلاث وظائف في الوقت نفسه.',
    bb3: 'سيارات تنتظر في الخارج والموظفون يركضون ذهاباً وإياباً.',
    bb4: 'طلبات تُملى وسط الضجيج — أخطاء، وإعادة تحضير، واعتذارات.',
    ba_after: 'ساعة الذروة مع Serva',
    ba1: 'كل طاولة وكاونتر وموقف سيارة يستقبل طلبه بنفسه.',
    ba2: 'الطلبات تصل إلى شاشة التحضير لحظة تأكيدها.',
    ba3: 'موظفوك يحضّرون المشروبات بدل تدوين الطلبات.',
    ba4: 'طلبات مكتوبة كما كتبها الزبون تماماً — بلا إعادة تحضير.',
    how_lbl: 'كيف يعمل',
    s1t: 'امسح الرمز', s1d: 'رمز QR على الطاولة أو الكاونتر أو لوحة الموقف يفتح قائمتك فوراً في المتصفح — لا تنزيل ولا تثبيت.',
    s2t: 'اختر واطلب', s2d: 'سلة سريعة بالعربية أو الإنجليزية، وأسعار بالريال العُماني، وإرسال بضغطة واحدة. والزبون الدائم يجد بياناته مُعبّأة مسبقاً.',
    s3t: 'حضّر وقدّم', s3d: 'يصل الطلب إلى شاشة التحضير لحظياً مع تنبيه صوتي، ويتابع الزبون حالة طلبه حتى يجهز — لا أحد يضطر للسؤال «هل جهز طلبي؟».',
    magic_lbl: 'المزايا',
    magic_h1: 'ثلاثة أشياء', magic_h2: 'لن تقدر عليها أي قائمة ورقية.',
    f1k: 'ذاكرة الجهاز', f1t: 'يعرف زبائنك الدائمين بالاسم',
    f1d: 'لحظة مسح الزبون العائد، يجد طلبه المفضّل ورقم هاتفه — وحتى رقم لوحة سيارته — معبّأة مسبقاً. من «وصلت للتو» إلى «أرسلت الطلب» في ثوانٍ، ويعود مرة بعد مرة لأن الطلب صار بلا مجهود.',
    f2k: 'مراقبة السلة المباشرة', f2t: 'شاهد الطلبات قبل إرسالها',
    f2d: 'راقب السلال وهي تمتلئ لحظياً، قبل أن يضغط أحد «اطلب». ترى الذروة وهي تتشكّل، وتبدأ التحضير مبكراً، وتُسرّع دوران الطاولات.',
    f3k: 'هوية خاصة', f3t: 'قائمتك بهويتك أنت',
    f3d: 'ألوانك وشعارك وصورك. يشعر الزبون أن مقهاك بنى تطبيقه الفاخر الخاص — لا رابط قائمة عام يحمل اسم شركة أخرى.',
    cap_lbl: 'كل شيء مشمول',
    i1t: 'عربي وإنجليزي', i1d: 'واجهة عربية أولاً مع تبديل فوري — قائمة واحدة باللغتين.',
    i2t: 'شاشة تحضير مباشرة', i2d: 'الطلبات تصل لحظياً مع تنبيه صوتي.',
    i3t: 'إدارة القائمة', i3d: 'أصناف وصور وتوفّر — تحديث بلمسة.',
    i4t: 'رموز QR بهويتك', i4d: 'للطاولات أو الكاونتر أو المواقف — أنشئ واطبع.',
    i5t: 'الدفع على طريقتك', i5d: 'نقداً أو بالبطاقة عند الاستلام — والدفع الإلكتروني اختياري.',
    i6t: 'تقارير', i6d: 'مبيعات اليوم وأكثر الأصناف طلباً، بنظرة واحدة.',
    i7t: 'وضع السيارة والطاولة', i7d: 'الاستلام من السيارة والطلب من الطاولة في نظام واحد — وكل طلب يخبرك أين زبونه.',
    i8t: 'بلا أجهزة جديدة', i8d: 'يعمل في المتصفح على الهواتف وأي شاشة تملكها.',
    price_lbl: 'السعر',
    price_h: 'سعر واحد. كل شيء مشمول.',
    price_amount: '29 ر.ع', price_per: 'لكل فرع · سنوياً',
    price_p: 'أقل من 2.5 ريال شهرياً. بلا عمولات، وبلا رسوم على الطلبات، وبلا عقود معقّدة. سجّل، وحوّل مرة واحدة في السنة، وانتهيت.',
    pr1: 'طلبات وأصناف بلا حدود',
    pr2: 'تطبيق الزبون + شاشة التحضير + التقارير',
    pr3: 'هويتك ورموز QR الخاصة بك مشمولة',
    pr4: 'نفعّل حسابك فور تأكيد التحويل',
    price_cta: 'ابدأ استقبال الطلبات',
    demo_lbl: 'العرض', demo_h: 'جرّبه بنفسك الآن.', demo_guest: 'ما يراه زبونك', demo_guest_c: 'تجربة الطلب بالمسح كما يراها تماماً', demo_dash: 'ما تراه أنت', demo_dash_c: 'شاشة التحضير والإدارة مباشرة',
    faq_lbl: 'أسئلة شائعة',
    q1: 'هل يحتاج زبائني إلى تنزيل تطبيق؟', a1: 'لا. يفتح الرمز قائمتك مباشرة في المتصفح — سفاري أو كروم أو غيرهما. يمسح الزبون ويطلب خلال ثوانٍ.',
    q2: 'هل يناسب الجلوس في المقهى والاستلام والسيارات؟', a2: 'الثلاثة معاً. كل رمز يعرف مكانه — طاولة 7، أو الكاونتر، أو موقف 3 — فيصل كل طلب وعليه مكان صاحبه.',
    q3: 'وماذا عن الدفع؟', a3: 'القرار لك. معظم المقاهي تستلم نقداً أو بالبطاقة عند التسليم، تماماً كاليوم. Serva يلغي الانتظار في الطلب، لا تحكّمك في الدفع.',
    q4: 'هل هو فعلاً بالعربية؟', a4: 'عربي أولاً. قائمتك ومسار الطلب ولوحة التحكم كلها بالعربية والإنجليزية، والأسعار بالريال العُماني.',
    q5: 'ماذا أحتاج أن أركّب؟', a5: 'لا شيء. اطبع الرموز، وافتح اللوحة على أي هاتف أو جهاز لوحي أو شاشة تملكها، وأنت جاهز.',
    q6: 'كم التكلفة؟', a6: '29 ريالاً عُمانياً لكل فرع سنوياً — سعر ثابت، وبلا أي عمولة على الطلبات.',
    req_lbl: 'ابدأ', req_h: 'ذروتك القادمة تدير نفسها.',
    req_p: 'أنشئ حسابك بنفسك وجهّز قائمتك خلال دقائق، وسنفعّله فور تأكيد التحويل. أو اترك بياناتك وسنتواصل معك.',
    f_cafe: 'اسم المقهى / النشاط', f_name: 'اسمك', f_phone: 'رقم الجوال', f_city: 'المدينة', f_note: 'ملاحظة (اختياري)',
    f_send: 'أرسل الطلب', f_sending: 'جارٍ الإرسال…', f_okh: 'وصلنا طلبك ✓', f_okp: 'شكراً لك — سنتواصل معك قريباً.',
    cta_big1: 'أوقف', cta_big2: 'الانتظار',
    foot_demo: 'العرض', foot_dash: 'لوحة الإدارة', foot_admin: 'لوحة المنصّة', foot_contact: 'تواصل',
    foot_privacy: 'الخصوصية', foot_terms: 'الشروط', foot_refund: 'الاسترداد', foot_made: 'صُنع لمقاهي وأنشطة عُمان الغذائية', foot_rights: 'جميع الحقوق محفوظة',
  },
  en: {
    nav_how: 'How', nav_feat: 'Features', nav_price: 'Pricing', nav_demo: 'Demo', nav_req: 'Get started', nav_signin: 'Sign in', cta_start: 'Start now',
    kicker: 'The line stops here.',
    h1a: 'Order from', h1b: 'anywhere', trans: 'اطلب من أي مكان.',
    sub: 'table, counter, or car.',
    lead: 'For cafés and restaurants in Oman. Your customers scan a QR from the table, the line, or the car, browse your menu in Arabic or English, and order in seconds — no app, no waiting, no waving for a waiter.',
    cta_req: 'Start taking orders', cta_demo: 'Watch it work', sl_scan: 'scan', sl_order: 'order', sl_track: 'pick up',
    prob_lbl: 'The problem',
    m1: 'The line at the counter, the waving at waiters, the cars idling outside —', m2: "it's all the same bottleneck.",
    ba_before: 'Rush hour without Serva',
    bb1: 'A line at the register, and people walking away from it.',
    bb2: "Customers waving for a waiter who's already doing three jobs.",
    bb3: 'Cars waiting outside while staff run back and forth.',
    bb4: 'Orders dictated over noise — mistakes, remakes, apologies.',
    ba_after: 'Rush hour with Serva',
    ba1: 'Every table, counter spot, and parking bay takes its own order.',
    ba2: 'Orders land on the prep screen the second they’re confirmed.',
    ba3: 'Your staff make drinks instead of taking dictation.',
    ba4: 'Orders written exactly as the customer typed them — no remakes.',
    how_lbl: 'How it works',
    s1t: 'Scan the code', s1d: 'A QR on the table, the counter, or the parking sign opens your menu instantly in the browser — nothing to download, nothing to install.',
    s2t: 'Pick & order', s2d: 'A fast cart in Arabic or English, prices in OMR, one tap to send. Returning customers find their details already filled in.',
    s3t: 'Make & serve', s3d: 'The order hits your prep display in real time with a sound cue, and the customer tracks it until it’s ready — nobody has to ask “is it done yet?”',
    magic_lbl: 'Features',
    magic_h1: 'Three things', magic_h2: 'no paper menu will ever do.',
    f1k: 'Device memory', f1t: 'It knows your regulars by heart',
    f1d: 'The moment a returning customer scans, their favorite order, phone number — even their car plate — are already filled in. Regulars go from “just parked” to “order sent” in seconds, and they keep coming back because ordering is effortless.',
    f2k: 'Live cart peek', f2t: 'See orders before they’re sent',
    f2d: 'Watch carts fill up in real time, before anyone presses “order”. You see the rush while it’s still forming, start prepping early, and turn tables faster.',
    f3k: 'Custom branding', f3t: 'Your menu, wearing your brand',
    f3d: 'Your colors, your logo, your photos. To customers it feels like your café built its own premium app — not a generic menu link with somebody else’s name on it.',
    cap_lbl: 'Everything included',
    i1t: 'Arabic & English', i1d: 'RTL-first with an instant switch — one menu, both languages.',
    i2t: 'Live prep display', i2d: 'Orders arrive in real time with a sound cue.',
    i3t: 'Menu management', i3d: 'Items, photos, availability — updated in a tap.',
    i4t: 'QR codes in your brand', i4d: 'For tables, the counter, or parking bays — generate & print.',
    i5t: 'Payments your way', i5d: 'Cash or card at pickup — online payment optional.',
    i6t: 'Reports', i6d: 'Today’s sales and your best sellers, at a glance.',
    i7t: 'Car & table modes', i7d: 'Curbside and dine-in in one system — every order says where its customer is.',
    i8t: 'No new hardware', i8d: 'Runs in the browser on phones and any screen you already own.',
    price_lbl: 'Pricing',
    price_h: 'One price. Everything included.',
    price_amount: '29 OMR', price_per: 'per branch · per year',
    price_p: 'Less than 2.5 rials a month. No commissions, no per-order fees, no contracts that need a lawyer. Sign up, transfer once a year, done.',
    pr1: 'Unlimited orders & menu items',
    pr2: 'Customer app + prep display + reports',
    pr3: 'Your branding & QR codes included',
    pr4: 'Activated as soon as your transfer is confirmed',
    price_cta: 'Start taking orders',
    demo_lbl: 'Demo', demo_h: 'Try it yourself, right now.', demo_guest: 'What your customer sees', demo_guest_c: 'Scan-to-order, exactly as they’d see it', demo_dash: 'What you see', demo_dash_c: 'Live prep display & management',
    faq_lbl: 'Questions',
    q1: 'Do my customers need to download an app?', a1: 'No. The QR opens your menu straight in the browser — Safari, Chrome, anything. They scan and they’re ordering within seconds.',
    q2: 'Does it work for tables and outdoor car service?', a2: 'Yes. Each QR knows where it lives — table 7 or the outdoor car QR — so every order arrives labeled with the right handoff point.',
    q3: 'What about payment?', a3: 'Your call. Most cafés take cash or card at pickup, exactly like today. Serva removes the wait from ordering, not your control over payment.',
    q4: 'Is it really in Arabic?', a4: 'Arabic-first, actually. Your menu, the ordering flow, and your dashboard all work in Arabic and English, with prices in OMR.',
    q5: 'What do I need to install?', a5: 'Nothing. Print the QR codes, open the dashboard on any phone, tablet, or screen you already own, and you’re live.',
    q6: 'What does it cost?', a6: '29 OMR per branch per year — flat. No commission on orders, ever.',
    req_lbl: 'Get started', req_h: 'Your next rush hour can run itself.',
    req_p: 'Create your account and set up your menu in minutes — we activate it as soon as your transfer is confirmed. Or leave your details and we’ll call you.',
    f_cafe: 'Business / café name', f_name: 'Your name', f_phone: 'Phone number', f_city: 'City', f_note: 'Note (optional)',
    f_send: 'Send request', f_sending: 'Sending…', f_okh: 'Got your request ✓', f_okp: 'Thank you — we’ll be in touch shortly.',
    cta_big1: 'Stop the', cta_big2: 'wait',
    foot_demo: 'Demo', foot_dash: 'Dashboard', foot_admin: 'Platform', foot_contact: 'Contact',
    foot_privacy: 'Privacy', foot_terms: 'Terms', foot_refund: 'Refunds', foot_made: 'Made for Omani cafés and food businesses', foot_rights: 'All rights reserved',
  },
};

const customerUrl = `/r/${DEMO.slug}/b/${DEMO.branchId}/t/${DEMO.tableToken}`;
const N = ['01', '02', '03', '04', '05', '06', '07', '08'];
const TICKER = ['قهوة', 'KARAK', 'لاتيه', 'ORDER', 'طاولتك', 'TABLE', 'سيارتك', 'SCAN', 'إسبريسو', 'NO APP', 'حلوى', 'PICKUP', 'مقهى', 'MENU', 'بلا طابور', 'QR'];

export default function LandingPage() {
  const { lang } = useI18n();
  const t = useT(T);
  const steps: [string, string][] = [['s1t', 's1d'], ['s2t', 's2d'], ['s3t', 's3d']];
  const feats: [string, string, string][] = [['f1k', 'f1t', 'f1d'], ['f2k', 'f2t', 'f2d'], ['f3k', 'f3t', 'f3d']];
  const caps: [string, string][] = [['i1t', 'i1d'], ['i2t', 'i2d'], ['i3t', 'i3d'], ['i4t', 'i4d'], ['i5t', 'i5d'], ['i6t', 'i6d'], ['i7t', 'i7d'], ['i8t', 'i8d']];
  const faqs: [string, string][] = [['q1', 'a1'], ['q2', 'a2'], ['q3', 'a3'], ['q4', 'a4'], ['q5', 'a5'], ['q6', 'a6']];

  return (
    <div className="ed">
      <div className="ed-glyph" aria-hidden>ق</div>

      <nav className="ed-top">
        <div className="ed-wrap row">
          <div className="ed-mark">
            <span className="mk">{BRAND.name.charAt(0)}</span><span>{BRAND.name}</span>
            {BRAND.working && <span className="ed-wn">{lang === 'ar' ? 'اسم مؤقت' : 'working title'}</span>}
          </div>
          <div className="ed-nav">
            <a href="#how">{t('nav_how')}</a>
            <a href="#magic">{t('nav_feat')}</a>
            <a href="#pricing">{t('nav_price')}</a>
            <a href="#demo">{t('nav_demo')}</a>
            <a href="#request">{t('nav_req')}</a>
          </div>
          <div className="ed-tools">
            <Link className="ed-signin" to="/signup">{t('cta_start')}</Link>
            <Link className="ed-signin" to="/dashboard">{t('nav_signin')}</Link>
          </div>
        </div>
      </nav>

      <header className="ed-hero ed-wrap">
        <div className="ed-kicker rv">{t('kicker')}</div>
        <h1 className="ed-h1 rv" style={{ animationDelay: '.06s' }}>{t('h1a')}<br />{t('h1b')}<span className="dot">.</span></h1>
        <div className="ed-trans rv" style={{ animationDelay: '.12s' }}>{t('trans')} <span className="ed-or">{t('sub')}</span></div>
        <p className="ed-lead rv" style={{ animationDelay: '.18s' }}>{t('lead')}</p>
        <div className="ed-actions rv" style={{ animationDelay: '.24s' }}>
          <Link className="ed-link" to="/signup">{t('cta_req')} ↗</Link>
          <Link className="ed-link alt" to={customerUrl}>{t('cta_demo')}</Link>
        </div>
        <div className="ed-stepline rv" style={{ animationDelay: '.3s' }}>
          <span><b>01</b>{t('sl_scan')}</span><span><b>02</b>{t('sl_order')}</span><span><b>03</b>{t('sl_track')}</span>
        </div>
      </header>

      <div className="ed-ticker"><div className="ed-track">{[...TICKER, ...TICKER].map((w, i) => <span key={i}>{w}</span>)}</div></div>

      <section className="ed-sec ed-wrap" id="problem">
        <div className="ed-lbl"><span className="n">{N[0]}</span>{t('prob_lbl')}</div>
        <h2 className="ed-statement">{t('m1')} <span className="hl">{t('m2')}</span></h2>
        <div className="ed-ba">
          <div className="ed-ba-col">
            <h3>{t('ba_before')}</h3>
            <ul>{['bb1', 'bb2', 'bb3', 'bb4'].map((k) => <li key={k}>{t(k)}</li>)}</ul>
          </div>
          <div className="ed-ba-col good">
            <h3>{t('ba_after')}</h3>
            <ul>{['ba1', 'ba2', 'ba3', 'ba4'].map((k) => <li key={k}>{t(k)}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="ed-sec ed-wrap" id="how">
        <div className="ed-lbl"><span className="n">{N[1]}</span>{t('how_lbl')}</div>
        <div className="ed-steps">
          {steps.map(([tk, dk], i) => (
            <div className="ed-step" key={tk}><div className="num">{N[i]}</div><div><h3>{t(tk)}</h3><p>{t(dk)}</p></div></div>
          ))}
        </div>
      </section>

      <section className="ed-sec ed-wrap" id="magic">
        <div className="ed-lbl"><span className="n">{N[2]}</span>{t('magic_lbl')}</div>
        <h2 className="ed-statement">{t('magic_h1')} <span className="hl">{t('magic_h2')}</span></h2>
        <div className="ed-magic">
          {feats.map(([kk, tk, dk], i) => (
            <div className="ed-magic-card" key={kk}>
              <span className="mn">{N[i]}</span>
              <span className="k">{t(kk)}</span>
              <h3>{t(tk)}</h3>
              <p>{t(dk)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="ed-sec ed-wrap" id="cap">
        <div className="ed-lbl"><span className="n">{N[3]}</span>{t('cap_lbl')}</div>
        <div className="ed-rows">
          {caps.map(([tk, dk], i) => (
            <div className="ed-row" key={tk}><span className="rn">{N[i]}</span><div><div className="rt">{t(tk)}</div><div className="rd">{t(dk)}</div></div></div>
          ))}
        </div>
      </section>

      <section className="ed-sec ed-wrap" id="pricing">
        <div className="ed-lbl"><span className="n">{N[4]}</span>{t('price_lbl')}</div>
        <h2 className="ed-statement" style={{ fontSize: 'clamp(28px,4.4vw,56px)' }}>{t('price_h')}</h2>
        <div className="ed-price">
          <div className="ed-price-card">
            <div className="ed-price-amount">{t('price_amount')}</div>
            <div className="ed-price-per">{t('price_per')}</div>
            <p className="ed-price-p">{t('price_p')}</p>
            <Link className="ed-link" to="/signup">{t('price_cta')} ↗</Link>
          </div>
          <ul className="ed-price-list">
            {['pr1', 'pr2', 'pr3', 'pr4'].map((k) => <li key={k}>{t(k)}</li>)}
          </ul>
        </div>
      </section>

      <section className="ed-sec ed-wrap" id="demo">
        <div className="ed-lbl"><span className="n">{N[5]}</span>{t('demo_lbl')}</div>
        <h2 className="ed-statement" style={{ fontSize: 'clamp(28px,4.4vw,56px)' }}>{t('demo_h')}</h2>
        <div className="ed-demo">
          <Link className="ed-demo-card" to={customerUrl}>
            <span className="tag">{t('demo_guest')}</span><span className="cap">{t('demo_guest_c')}</span><span className="go">↗</span>
          </Link>
          <Link className="ed-demo-card" to="/dashboard">
            <span className="tag">{t('demo_dash')}</span><span className="cap">{t('demo_dash_c')}</span><span className="go">↗</span>
          </Link>
        </div>
      </section>

      <section className="ed-sec ed-wrap" id="faq">
        <div className="ed-lbl"><span className="n">{N[6]}</span>{t('faq_lbl')}</div>
        <div className="ed-faq">
          {faqs.map(([qk, ak], i) => (
            <details key={qk}>
              <summary><span className="qn">{N[i]}</span>{t(qk)}<span className="qa">+</span></summary>
              <p className="ans">{t(ak)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="ed-sec ed-wrap" id="request">
        <div className="ed-lbl"><span className="n">{N[7]}</span>{t('req_lbl')}</div>
        <h2 className="ed-statement">{t('req_h')}</h2>
        <p className="ed-lead" style={{ marginTop: 14 }}>{t('req_p')}</p>
        <RequestForm t={t} />
      </section>

      <section className="ed-cta">
        <h2>{t('cta_big1')}<br />{t('cta_big2')}<span className="dot">.</span></h2>
        <Link className="ed-link" to="/signup">{t('cta_start')} ↗</Link>
      </section>

      <footer className="ed-foot ed-wrap">
        <div className="grid">
          <div>
            <div className="ed-mark"><span className="mk">{BRAND.name.charAt(0)}</span><span>{BRAND.name}</span></div>
            <p className="tag">{BRAND.tagline[lang]}</p>
          </div>
          <div>
            <h4>{t('nav_demo')}</h4>
            <Link to={customerUrl}>{t('foot_demo')}</Link>
            <Link to="/dashboard">{t('foot_dash')}</Link>
            <Link to="/admin">{t('foot_admin')}</Link>
          </div>
          <div>
            <h4>{t('foot_contact')}</h4>
            <a href="mailto:hello@serva.app">hello@serva.app</a>
            <a href="tel:+96890000000">+968 9000 0000</a>
            <a href="#request">{t('nav_req')}</a>
          </div>
        </div>
        <div className="big">{BRAND.name}</div>
        <div className="bar">
          <span className="mono">© {new Date().getFullYear()} {BRAND.name}</span>
          <span>· {t('foot_rights')}</span>
          <span className="sp" />
          <Link to="/privacy">{t('foot_privacy')}</Link><Link to="/terms">{t('foot_terms')}</Link><Link to="/refund">{t('foot_refund')}</Link>
          <span>· {t('foot_made')}</span>
        </div>
      </footer>
    </div>
  );
}

function RequestForm({ t }: { t: (k: string) => string }) {
  const toast = useToast();
  const [f, setF] = useState({ cafeName: '', contactName: '', phone: '', city: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const valid = f.cafeName.trim() && f.contactName.trim() && f.phone.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    try {
      await api.post('/api/public/leads', f, { auth: false });
      setDone(true);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="ed-ok">
        <div className="ed-ok-mk">✓</div>
        <h3>{t('f_okh')}</h3>
        <p>{t('f_okp')}</p>
      </div>
    );
  }

  return (
    <form className="ed-form" onSubmit={submit}>
      <label className="ef"><span>{t('f_cafe')}</span><input value={f.cafeName} onChange={(e) => set('cafeName', e.target.value)} required /></label>
      <label className="ef"><span>{t('f_name')}</span><input value={f.contactName} onChange={(e) => set('contactName', e.target.value)} required /></label>
      <label className="ef"><span>{t('f_phone')}</span><input className="num" inputMode="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="9XXXXXXX" required /></label>
      <label className="ef"><span>{t('f_city')}</span><input value={f.city} onChange={(e) => set('city', e.target.value)} /></label>
      <label className="ef ef-full"><span>{t('f_note')}</span><textarea rows={2} value={f.note} onChange={(e) => set('note', e.target.value)} /></label>
      <div className="ed-form-foot">
        <button className="btn" type="submit" disabled={!valid || loading}>{loading ? t('f_sending') : `${t('f_send')} ↗`}</button>
      </div>
    </form>
  );
}
