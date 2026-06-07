// Template legal copy for launch. HAVE THIS REVIEWED BY COUNSEL and replace the contact details
// + add your registered company legal name / CR number before relying on it in production.
import { Link } from 'react-router-dom';
import { useI18n, LangToggle } from '../../lib/i18n';
import { ThemeToggle } from '../../lib/theme';
import { BRAND } from '../../lib/brand';
import './site.css';

type Doc = 'terms' | 'privacy' | 'refund';
type Section = { h: string; p: string };
type Content = { kicker: string; title: string; updated: string; sections: Section[]; contact: string };

const CONTACT_EMAIL = 'hello@serva.app';

const DOCS: Record<Doc, Record<'ar' | 'en', Content>> = {
  terms: {
    en: {
      kicker: 'Legal', title: 'Terms of Service', updated: 'Last updated: June 2026',
      sections: [
        { h: '1. The service', p: 'Serva provides a QR-code ordering platform that lets cafés and food trucks in Oman publish a digital menu and receive orders. By creating an account you agree to these terms.' },
        { h: '2. Your account', p: 'You are responsible for keeping your login secure and for the accuracy of your menu, prices and the orders you accept. You must not use the service for unlawful purposes.' },
        { h: '3. Subscription & payment', p: 'Access is sold as an annual subscription paid by bank transfer. Your account is activated once we confirm payment and stays active until the end of the paid term. If you do not renew, your public menu goes offline after a short grace period. Prices may change with notice for future terms.' },
        { h: '4. Availability', p: 'We work to keep the service available, but provide it “as is” without warranty of uninterrupted or error-free operation.' },
        { h: '5. Limitation of liability', p: 'To the extent permitted by law, Serva is not liable for indirect or consequential losses, or for amounts exceeding the fees you paid in the prior twelve months.' },
        { h: '6. Termination', p: 'You may stop using the service at any time. We may suspend accounts that breach these terms or remain unpaid.' },
        { h: '7. Governing law', p: 'These terms are governed by the laws of the Sultanate of Oman.' },
      ],
      contact: `Questions? Contact us at ${CONTACT_EMAIL}.`,
    },
    ar: {
      kicker: 'قانوني', title: 'شروط الخدمة', updated: 'آخر تحديث: يونيو 2026',
      sections: [
        { h: '١. الخدمة', p: 'تقدّم Serva منصّة طلب عبر رمز QR تتيح للمقاهي وعربات الطعام في عُمان نشر قائمة رقمية واستقبال الطلبات. بإنشائك حساباً فأنت توافق على هذه الشروط.' },
        { h: '٢. حسابك', p: 'أنت مسؤول عن الحفاظ على بيانات دخولك وعن دقّة قائمتك وأسعارك والطلبات التي تقبلها، ولا يجوز استخدام الخدمة لأغراض غير قانونية.' },
        { h: '٣. الاشتراك والدفع', p: 'يُباع الوصول كاشتراك سنوي يُدفع عبر التحويل البنكي. يُفعّل حسابك فور تأكيد الدفع ويبقى نشطاً حتى نهاية المدة المدفوعة. وإن لم تُجدّد تتوقّف قائمتك العامة بعد مهلة قصيرة. وقد تتغيّر الأسعار للمدد القادمة بإشعار مسبق.' },
        { h: '٤. التوفّر', p: 'نسعى لإبقاء الخدمة متاحة، لكنها تُقدَّم «كما هي» دون ضمان تشغيل متواصل أو خالٍ من الأخطاء.' },
        { h: '٥. حدود المسؤولية', p: 'بالقدر الذي يسمح به القانون، لا تتحمّل Serva المسؤولية عن الأضرار غير المباشرة أو التبعية، أو عن مبالغ تتجاوز ما دفعته خلال الاثني عشر شهراً السابقة.' },
        { h: '٦. الإنهاء', p: 'يمكنك التوقّف عن استخدام الخدمة في أي وقت، ويجوز لنا تعليق الحسابات المخالفة لهذه الشروط أو غير المدفوعة.' },
        { h: '٧. القانون الحاكم', p: 'تخضع هذه الشروط لقوانين سلطنة عُمان.' },
      ],
      contact: `لأي استفسار تواصل معنا على ${CONTACT_EMAIL}.`,
    },
  },
  privacy: {
    en: {
      kicker: 'Legal', title: 'Privacy Policy', updated: 'Last updated: June 2026',
      sections: [
        { h: 'What we collect', p: 'Café account details (name, email, phone), your menu and order data, and information customers enter when ordering (such as a name or phone number, only if they provide it). We also keep basic technical logs.' },
        { h: 'How we use it', p: 'To run the platform, process and track orders, and send service emails — signup instructions, activation, password reset and renewal reminders.' },
        { h: 'Sharing', p: 'We use trusted providers to deliver email (and, where enabled, SMS) on our behalf. We do not sell your data.' },
        { h: 'Retention', p: 'We keep data while your account is active and as needed for legal and accounting purposes, then delete or anonymise it.' },
        { h: 'Security', p: 'We use industry-standard measures to protect your data, though no system can be perfectly secure.' },
        { h: 'Your choices', p: 'Contact us to access, correct or delete your data.' },
      ],
      contact: `Privacy questions? Email ${CONTACT_EMAIL}.`,
    },
    ar: {
      kicker: 'قانوني', title: 'سياسة الخصوصية', updated: 'آخر تحديث: يونيو 2026',
      sections: [
        { h: 'ما الذي نجمعه', p: 'بيانات حساب المقهى (الاسم، البريد، الهاتف)، وقائمتك وبيانات الطلبات، والمعلومات التي يُدخلها الزبائن عند الطلب (كالاسم أو رقم الهاتف، إن قدّموها فقط). كما نحتفظ بسجلات تقنية أساسية.' },
        { h: 'كيف نستخدمها', p: 'لتشغيل المنصّة ومعالجة الطلبات وتتبّعها، وإرسال رسائل الخدمة — تعليمات التسجيل والتفعيل وإعادة تعيين كلمة المرور وتذكير التجديد.' },
        { h: 'المشاركة', p: 'نستعين بمزوّدين موثوقين لإرسال البريد (والرسائل النصية عند التفعيل) نيابةً عنّا، ولا نبيع بياناتك.' },
        { h: 'الاحتفاظ', p: 'نحتفظ بالبيانات طالما كان حسابك نشطاً وبما يلزم للأغراض القانونية والمحاسبية، ثم نحذفها أو نجعلها مجهولة الهوية.' },
        { h: 'الأمان', p: 'نستخدم تدابير وفق معايير الصناعة لحماية بياناتك، مع أنه لا يوجد نظام آمن تماماً.' },
        { h: 'خياراتك', p: 'تواصل معنا للوصول إلى بياناتك أو تصحيحها أو حذفها.' },
      ],
      contact: `لاستفسارات الخصوصية راسلنا على ${CONTACT_EMAIL}.`,
    },
  },
  refund: {
    en: {
      kicker: 'Legal', title: 'Refund & Cancellation', updated: 'Last updated: June 2026',
      sections: [
        { h: 'Annual subscription', p: 'Fees are paid yearly by bank transfer and are non-refundable once your account is activated.' },
        { h: 'Cancellation', p: 'You can cancel anytime. There is no automatic charge — renewal only happens when you choose to pay again, so if you don’t renew, your café simply goes offline at the end of the paid term.' },
        { h: 'Before activation', p: 'If you sign up but do not complete payment, you are not charged and nothing goes live.' },
        { h: 'Billing issues', p: 'If something went wrong with a transfer, contact us and we’ll help sort it out.' },
      ],
      contact: `Billing questions? Email ${CONTACT_EMAIL}.`,
    },
    ar: {
      kicker: 'قانوني', title: 'سياسة الاسترداد والإلغاء', updated: 'آخر تحديث: يونيو 2026',
      sections: [
        { h: 'الاشتراك السنوي', p: 'تُدفع الرسوم سنوياً عبر التحويل البنكي وغير قابلة للاسترداد بعد تفعيل الحساب.' },
        { h: 'الإلغاء', p: 'يمكنك الإلغاء في أي وقت. لا يوجد خصم تلقائي — لا يتم التجديد إلا باختيارك الدفع مجدداً، فإن لم تُجدّد يتوقّف مقهاك ببساطة في نهاية المدة المدفوعة.' },
        { h: 'قبل التفعيل', p: 'إن سجّلت ولم تُكمل الدفع، فلن يتم تحصيل أي مبلغ ولن يُنشر شيء.' },
        { h: 'مشاكل الدفع', p: 'إن حدث خطأ في التحويل، تواصل معنا وسنساعدك في حلّه.' },
      ],
      contact: `لاستفسارات الفوترة راسلنا على ${CONTACT_EMAIL}.`,
    },
  },
};

export default function LegalPage({ doc }: { doc: Doc }) {
  const { lang } = useI18n();
  const d = DOCS[doc][lang];

  return (
    <div className="ed">
      <nav className="ed-top">
        <div className="ed-wrap row">
          <Link className="ed-mark" to="/"><span className="mk">{BRAND.name.charAt(0)}</span><span>{BRAND.name}</span></Link>
          <div className="ed-nav"><Link to="/">{lang === 'ar' ? '← الرئيسية' : '← Home'}</Link></div>
          <div className="ed-tools"><ThemeToggle /><LangToggle /></div>
        </div>
      </nav>

      <section className="ed-sec ed-wrap" style={{ maxWidth: 820 }}>
        <div className="ed-lbl"><span className="n">§</span>{d.kicker}</div>
        <h1 className="ed-statement" style={{ fontSize: 'clamp(30px,5vw,56px)' }}>{d.title}</h1>
        <p className="ed-lead" style={{ marginTop: 12 }}>{d.updated}</p>

        {d.sections.map((s) => (
          <div key={s.h} style={{ marginTop: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{s.h}</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75 }}>{s.p}</p>
          </div>
        ))}

        <p className="ed-lead" style={{ marginTop: 34 }}>{d.contact}</p>
        <Link className="ed-link" to="/" style={{ marginTop: 20 }}>{lang === 'ar' ? '← الرئيسية' : '← Home'}</Link>
      </section>
    </div>
  );
}
