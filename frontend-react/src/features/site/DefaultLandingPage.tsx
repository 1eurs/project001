import { useI18n } from '../../lib/i18n';
import L4Bold from '../landing-designs/designs/L4Bold';

export default function DefaultLandingPage() {
  const { lang } = useI18n();
  return <L4Bold lang={lang} showTools />;
}
