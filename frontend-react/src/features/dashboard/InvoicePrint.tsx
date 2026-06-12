import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { omr } from '../../lib/format';
import { carColorOf } from '../../lib/carColors';
import type { OrderResponse, Restaurant, TableResponse } from '../../lib/types';

/* Bilingual (ع/EN) 80mm receipt for one order. Portaled to <body> so the print
   stylesheet can show only this (same trick as the QR table tents); mounts,
   fires window.print() once the venue lookups settle, unmounts on afterprint.
   Labels are always printed in both languages — receipts in Oman are bilingual,
   so the cashier never has to pick a language first. */
export default function InvoicePrint({ order, onDone }: { order: OrderResponse; onDone: () => void }) {
  const { user } = useAuth();
  const restaurantId = user?.restaurantId;

  const restQ = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => api.get<Restaurant>(`/api/restaurants/${restaurantId}`),
    enabled: !!restaurantId,
  });
  const tablesQ = useQuery({
    queryKey: ['tables', order.branchId],
    queryFn: () => api.get<any>(`/api/branches/${order.branchId}/tables`),
    enabled: !!order.tableId && !!order.branchId,
  });
  const tableNumber = useMemo(() => {
    if (!order.tableId) return null;
    const list: TableResponse[] = Array.isArray(tablesQ.data) ? tablesQ.data : tablesQ.data?.content ?? [];
    return list.find((tb) => tb.id === order.tableId)?.tableNumber ?? null;
  }, [tablesQ.data, order.tableId]);

  // Print once the header data is in (usually an instant cache hit); a failed
  // lookup still prints — the order itself carries everything that matters.
  const ready = !restQ.isLoading && (!order.tableId || !tablesQ.isLoading);
  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => window.print(), 80);
    return () => window.clearTimeout(id);
  }, [ready]);
  useEffect(() => {
    window.addEventListener('afterprint', onDone);
    return () => window.removeEventListener('afterprint', onDone);
  }, [onDone]);

  const r = restQ.data;
  const cc = carColorOf(order.carColor);
  const typeLine = order.orderType === 'DINE_IN'
    ? `طاولة / Table${tableNumber ? ` ${tableNumber}` : ''}`
    : order.orderType === 'CAR'
      ? `سيارة / Car${order.carPlate ? ` · ${order.carPlate}` : ''}${cc ? ` · ${cc.ar} / ${cc.en}` : ''}`
      : 'سفري / Takeaway';
  const showVat = !!r?.vatEnabled || order.vatAmount > 0;

  return createPortal(
    <div className="invoice-sheet" dir="rtl">
      <style>{'@page{size:80mm auto;margin:3mm}'}</style>
      <div className="inv-name">{r?.name ?? ''}</div>
      {r?.phone && <div className="inv-sub num">{r.phone}</div>}
      <div className="inv-title">فاتورة / Invoice</div>
      <div className="inv-row"><span>رقم الطلب / Order</span><span className="amt">{order.orderNumber}</span></div>
      <div className="inv-row"><span>التاريخ / Date</span><span className="amt">{new Date(order.createdAt).toLocaleString()}</span></div>
      <div className="inv-row"><span>النوع / Type</span><span>{typeLine}</span></div>
      {order.customerName && <div className="inv-row"><span>العميل / Customer</span><span>{order.customerName}</span></div>}
      <div className="inv-hr" />
      {order.items.map((i, n) => (
        <div className="inv-item" key={n}>
          <div className="inv-row">
            <span><span className="num">{i.quantity}×</span> {i.nameAr || i.nameEn}
              {i.nameAr && i.nameEn && i.nameAr !== i.nameEn && <span className="inv-en"> {i.nameEn}</span>}</span>
            <span className="amt">{omr(i.lineTotal)}</span>
          </div>
          {i.note && <div className="inv-note">↳ {i.note}</div>}
        </div>
      ))}
      <div className="inv-hr" />
      <div className="inv-row"><span>المجموع / Subtotal</span><span className="amt">{omr(order.subtotal)} OMR</span></div>
      {showVat && (
        <div className="inv-row"><span>الضريبة / VAT{r?.vatRate ? ` ${r.vatRate}%` : ''}</span><span className="amt">{omr(order.vatAmount)} OMR</span></div>
      )}
      <div className="inv-row inv-total"><span>الإجمالي / Total</span><span className="amt">{omr(order.total)} OMR</span></div>
      <div className="inv-row"><span>الدفع / Payment</span>
        <span>{order.paymentStatus === 'PAID' ? `مدفوع / Paid${order.paymentMethod ? ` · ${order.paymentMethod}` : ''}` : 'غير مدفوع / Unpaid'}</span></div>
      <div className="inv-hr" />
      <div className="inv-thanks">شكراً لزيارتكم / Thank you</div>
      <div className="inv-brand">Serva.</div>
    </div>,
    document.body,
  );
}
