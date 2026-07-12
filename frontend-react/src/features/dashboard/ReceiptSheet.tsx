import { carColorOf } from '../../lib/carColors';
import { Money } from '../../lib/Money';
import { parseReceiptSettings, type ReceiptSettings } from '../../lib/receiptSettings';
import type { OrderResponse, PaymentMethod, Restaurant } from '../../lib/types';

/* Bilingual (ع/EN) 80mm receipt markup for one order, rasterized to an image and sent to
   RawBT by ReceiptCapture.tsx — both the auto-print-on-complete flow and the manual "🖨 Print
   invoice" buttons (KDS board, order history — see receiptPrinter.tsx) render this exact
   markup, so every print path stays visually identical.

   Per-café customization (style preset, logo, footer, VAT/CR numbers) comes from
   restaurant.receiptSettingsJson (see lib/receiptSettings.ts); the profile's live preview
   passes its unsaved draft via settingsOverride. */

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: 'نقداً / Cash',
  CARD: 'بطاقة / Card',
  ONLINE: 'إلكتروني / Online',
  OTHER: 'أخرى / Other',
};

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
      {s.showLogo && r?.logoUrl && (
        <div className="inv-logo-wrap"><img className="inv-logo" src={r.logoUrl} alt="" /></div>
      )}
      <div className="inv-name">{r?.name ?? ''}</div>
      {r?.phone && <div className="inv-sub num">{r.phone}</div>}
      {s.vatNumber && <div className="inv-sub num">الرقم الضريبي / VAT No: {s.vatNumber}</div>}
      {s.crNumber && <div className="inv-sub num">السجل التجاري / CR No: {s.crNumber}</div>}
      <div className="inv-title">فاتورة / Invoice</div>
      <div className="inv-row"><span>رقم الطلب / Order</span><span className="amt">#{order.dailyNumber}</span></div>
      <div className="inv-row"><span>التاريخ / Date</span><span className="amt">{new Date(order.createdAt).toLocaleString()}</span></div>
      <div className="inv-row"><span>النوع / Type</span><span>{typeLine}</span></div>
      {order.customerName && <div className="inv-row"><span>العميل / Customer</span><span>{order.customerName}</span></div>}
      <div className="inv-hr" />
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
      <div className="inv-hr" />
      <div className="inv-row"><span>المجموع / Subtotal</span><Money value={order.subtotal} className="amt" /></div>
      {showVat && (
        <div className="inv-row"><span>الضريبة / VAT{r?.vatRate ? ` ${r.vatRate}%` : ''}</span><Money value={order.vatAmount} className="amt" /></div>
      )}
      <div className="inv-row inv-total"><span>الإجمالي / Total</span><Money value={order.total} className="amt" /></div>
      {paid && (
        <div className="inv-row"><span>الدفع / Payment</span><span>{PAYMENT_LABELS[order.paymentMethod!]}</span></div>
      )}
      <div className="inv-hr" />
      <div className="inv-thanks">شكراً لزيارتكم / Thank you</div>
      {s.footerText && <div className="inv-footer">{s.footerText}</div>}
      <div className="inv-brand">Serva.</div>
    </div>
  );
}
