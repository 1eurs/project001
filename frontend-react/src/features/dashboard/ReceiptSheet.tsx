import { carColorOf } from '../../lib/carColors';
import { Money } from '../../lib/Money';
import { parseReceiptSettings, type ReceiptSettings, type ReceiptStyle } from '../../lib/receiptSettings';
import type { OrderResponse, PaymentMethod, Restaurant } from '../../lib/types';

/* Bilingual (ع/EN) 80mm receipt markup for one order, rasterized to an image and sent to
   RawBT by ReceiptCapture.tsx — both the auto-print-on-complete flow and the manual "🖨 Print
   invoice" buttons (KDS board, order history — see receiptPrinter.tsx) render this exact
   markup, so every print path stays visually identical.

   Per-café customization (style preset, logo, footer, VAT/CR numbers) comes from
   restaurant.receiptSettingsJson (see lib/receiptSettings.ts); the profile's live preview
   passes its unsaved draft via settingsOverride.

   Character-art styles (retro/fancy/ticket) rely on system-font glyphs (═ ─ ╌ ✂ ✦ ★) —
   safe because the receipt is rasterized by the device browser, never by the printer. */

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: 'نقداً / Cash',
  CARD: 'بطاقة / Card',
  ONLINE: 'إلكتروني / Online',
  OTHER: 'أخرى / Other',
};

/* Long repeated strings clipped by the divider's overflow:hidden — an easy way to get
   full-width character rules without measuring the paper in ch units. */
const DIVIDERS: Record<ReceiptStyle, string | null> = {
  classic: null, // CSS dashed border
  minimal: null, // CSS solid border
  bold: null,    // CSS thick border
  retro: '='.repeat(72),
  fancy: '· '.repeat(60),
  ticket: '• '.repeat(60),
};

function Divider({ style }: { style: ReceiptStyle }) {
  const text = DIVIDERS[style];
  if (!text) return <div className="inv-hr" />;
  return <div className="inv-hr-txt" aria-hidden>{text}</div>;
}

/** ✂ tear-line used by the ticket style at both ends of the slip. */
function TearLine() {
  return <div className="inv-tear" aria-hidden>{'✂ ' + '╌ '.repeat(60)}</div>;
}

export default function ReceiptSheet({ order, restaurant: r, tableNumber, settingsOverride }: {
  order: OrderResponse; restaurant: Restaurant | undefined; tableNumber: string | null;
  settingsOverride?: ReceiptSettings;
}) {
  const s = settingsOverride ?? parseReceiptSettings(r?.receiptSettingsJson);
  const cc = carColorOf(order.carColor);
  const typeLine = order.orderType === 'DINE_IN'
    ? `طاولة / Table${tableNumber ? ` ${tableNumber}` : ''}`
    : `سيارة / Car${order.carPlate ? ` · ${order.carPlate}` : ''}${cc ? ` · ${cc.ar} / ${cc.en}` : ''}`;
  const showVat = !!r?.vatEnabled || order.vatAmount > 0;
  const paid = order.paymentStatus === 'PAID' && !!order.paymentMethod;
  const noteLines = order.items.reduce((sum, item) => sum + (item.note ? 1 : 0), 0);
  const receiptHeightMm = Math.min(600, Math.max(130, 92 + order.items.length * 11 + noteLines * 6));

  return (
    <div className={`invoice-sheet rcpt-${s.style}`} dir="rtl">
      <style>{`@page{size:80mm ${receiptHeightMm}mm;margin:0}@media print{html,body{width:80mm;margin:0!important;background:#fff!important}}`}</style>
      {s.style === 'ticket' && <TearLine />}
      {s.showLogo && r?.logoUrl && (
        <div className="inv-logo-wrap"><img className="inv-logo" src={r.logoUrl} alt="" /></div>
      )}
      {s.style === 'fancy' && <div className="inv-ornament" aria-hidden>─── ✦ ───</div>}
      <div className="inv-name">{r?.name ?? ''}</div>
      {s.style === 'fancy' && <div className="inv-ornament" aria-hidden>─── ✦ ───</div>}
      {s.showPhone && r?.phone && <div className="inv-sub num">{r.phone}</div>}
      {s.vatNumber && <div className="inv-sub num">الرقم الضريبي / VAT No: {s.vatNumber}</div>}
      {s.crNumber && <div className="inv-sub num">السجل التجاري / CR No: {s.crNumber}</div>}
      {s.style === 'ticket' ? (
        <div className="inv-ticket-no"><span>فاتورة / Invoice</span><b className="num">#{order.dailyNumber}</b></div>
      ) : (
        <div className="inv-title">{s.style === 'retro' ? '*** فاتورة / INVOICE ***' : 'فاتورة / Invoice'}</div>
      )}
      {s.style !== 'ticket' && (
        <div className="inv-row"><span>رقم الطلب / Order</span><span className="amt">#{order.dailyNumber}</span></div>
      )}
      <div className="inv-row"><span>التاريخ / Date</span><span className="amt">{new Date(order.createdAt).toLocaleString()}</span></div>
      <div className="inv-row"><span>النوع / Type</span><span>{typeLine}</span></div>
      {order.customerName && <div className="inv-row"><span>العميل / Customer</span><span>{order.customerName}</span></div>}
      <Divider style={s.style} />
      {order.items.map((i, n) => (
        <div className="inv-item" key={n}>
          <div className="inv-row">
            <span><span className="num">{i.quantity}×</span> {i.nameAr || i.nameEn}
              {i.nameAr && i.nameEn && i.nameAr !== i.nameEn && <span className="inv-en"> {i.nameEn}</span>}</span>
            <Money value={i.lineTotal} className="amt" />
          </div>
          {i.note && <div className="inv-note">↳ {i.note}</div>}
        </div>
      ))}
      <Divider style={s.style} />
      <div className="inv-row"><span>المجموع / Subtotal</span><Money value={order.subtotal} className="amt" /></div>
      {showVat && (
        <div className="inv-row"><span>الضريبة / VAT{r?.vatRate ? ` ${r.vatRate}%` : ''}</span><Money value={order.vatAmount} className="amt" /></div>
      )}
      <div className="inv-row inv-total"><span>الإجمالي / Total</span><Money value={order.total} className="amt" /></div>
      {paid && (
        <div className="inv-row"><span>الدفع / Payment</span><span>{PAYMENT_LABELS[order.paymentMethod!]}</span></div>
      )}
      <Divider style={s.style} />
      <div className="inv-thanks">{s.style === 'fancy' ? '✦ شكراً لزيارتكم / Thank you ✦' : 'شكراً لزيارتكم / Thank you'}</div>
      {s.footerText && <div className="inv-footer">{s.footerText}</div>}
      {s.style === 'ticket' && <TearLine />}
    </div>
  );
}
