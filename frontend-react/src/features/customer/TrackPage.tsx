import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { OrderTracking, OrderStatus } from '../../lib/types';
import { omr } from '../../lib/format';
import { useI18n, useT, type Dict } from '../../lib/i18n';
import { useOrderStream } from '../../lib/sse';
import { useAudioArm, playChime, vibrate } from '../../lib/alerts';
import { menuPathOf, useVenue } from './venue';
import { CustomerFrame } from './CustomerFrame';

const FLOW: OrderStatus[] = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'];
const DICT: Dict = {
  ar: { title: 'تتبّع الطلب', orderNo: 'رقم الطلب', cur: 'ر.ع', min: 'د', total: 'الإجمالي', back: 'العودة للقائمة', estPrep: 'الوقت المقدّر', thanks: 'شكراً لك',
        head_PENDING: 'تم الإرسال — بانتظار المقهى', head_ACCEPTED: 'تم القبول', head_PREPARING: 'قيد التحضير', head_READY: 'جاهز للتقديم', head_COMPLETED: 'اكتمل الطلب', head_DECLINED: 'اعتُذر عن الطلب', head_CANCELLED: 'أُلغي الطلب',
        st_PENDING: 'أرسلنا طلبك', st_ACCEPTED: 'قبِله المقهى', st_PREPARING: 'يُحضَّر الآن', st_READY: 'جاهز!' },
  en: { title: 'Track order', orderNo: 'Order', cur: 'OMR', min: 'min', total: 'Total', back: 'Back to menu', estPrep: 'Estimated', thanks: 'Thank you',
        head_PENDING: 'Sent — waiting for the cafe', head_ACCEPTED: 'Accepted', head_PREPARING: 'Preparing', head_READY: 'Ready to serve', head_COMPLETED: 'Completed', head_DECLINED: 'Order declined', head_CANCELLED: 'Order cancelled',
        st_PENDING: 'Order sent', st_ACCEPTED: 'Cafe accepted', st_PREPARING: 'Being prepared', st_READY: 'Ready!' },
};

export default function TrackPage() {
  const { trackingToken = '' } = useParams();
  const { lang } = useI18n();
  const t = useT(DICT);
  const nav = useNavigate();
  const qc = useQueryClient();
  const { slug, branchId, tableToken, orderType } = useVenue();

  const key = ['order', trackingToken];
  const { data: o, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => api.get<OrderTracking>(`/api/public/orders/${trackingToken}`, { auth: false }),
    refetchInterval: 20_000, // safety net alongside SSE
  });

  // live updates — refetch on any order.* event
  useOrderStream(trackingToken ? `/api/public/orders/${trackingToken}/stream` : null, () => {
    qc.invalidateQueries({ queryKey: key });
  });

  // chime + buzz the customer's phone the moment the cafe accepts the order and
  // again when it's ready — handy for car-service waiting in the lot.
  useAudioArm();
  const prevStatus = useRef<OrderStatus | null>(null);
  useEffect(() => {
    if (!o) return;
    const was = prevStatus.current;
    prevStatus.current = o.status;
    if (was && was !== o.status && (o.status === 'ACCEPTED' || o.status === 'READY')) {
      playChime();
      vibrate([60, 70, 60]);
    }
  }, [o?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const menuPath = menuPathOf(slug, branchId, tableToken, orderType);

  if (isLoading || !o) return <CustomerFrame><div className="center"><div className="spinner" /></div></CustomerFrame>;

  const idx = FLOW.indexOf(o.status);
  const bad = o.status === 'DECLINED' || o.status === 'CANCELLED';

  return (
    <CustomerFrame>
      <header className="c-vhdr">
        <button className="c-back" onClick={() => nav(menuPath)} aria-label="back"><span className="arr">›</span></button>
        <h2>{t('title')}</h2>
      </header>

      <div className="c-vbody">
        <div className="c-track">
          <div className="no">{t('orderNo')} · <span className="num">{o.orderNumber}</span></div>
          <div className="state">{!bad && <span className="c-pulse" />}{t('head_' + o.status)}</div>
          <div className="sub">
            {o.status === 'ACCEPTED' && o.prepTimeMinutes
              ? <>{t('estPrep')} ~ <span className="num">{o.prepTimeMinutes}</span> {t('min')}</>
              : (o.customerName ? `${t('thanks')}، ${o.customerName}` : t('thanks'))}
          </div>
        </div>

        {bad ? (
          o.declineReason && <div className="c-decline">{o.declineReason}</div>
        ) : (
          <div className="c-stepper">
            {FLOW.map((st, i) => {
              const cls = i < idx ? 'done' : i === idx ? 'active' : '';
              const icon = i < idx ? '✓' : i === idx ? '●' : String(i + 1);
              return (
                <div className={'c-step ' + cls} key={st}>
                  <div className="dot">{icon}</div>
                  <div className="txt"><b>{t('st_' + st)}</b></div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {o.items.map((it, i) => (
            <div className="c-totals" style={{ marginBottom: 0, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} key={i}>
              <span><span className="num">{it.quantity}×</span> {lang === 'ar' ? (it.nameAr || it.nameEn) : (it.nameEn || it.nameAr)}</span>
              <span className="num">{omr(it.lineTotal)} {t('cur')}</span>
            </div>
          ))}
        </div>

        <div className="c-totals" style={{ marginTop: 14 }}>
          <div className="row grand"><span>{t('total')}</span><span className="num">{omr(o.total)} {t('cur')}</span></div>
        </div>

        <button className="btn ghost full" style={{ marginTop: 18 }} onClick={() => nav(menuPath)}>{t('back')}</button>
      </div>
    </CustomerFrame>
  );
}
