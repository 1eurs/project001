import { useEffect } from 'react';
import { useI18n } from '../../lib/i18n';
import { ensureGoogleFonts, BOLD_FONTS } from '../../lib/fonts';
import L4Bold from '../landing-designs/designs/L4Bold';

export default function DefaultLandingPage() {
  const { lang } = useI18n();
  useEffect(() => { ensureGoogleFonts(BOLD_FONTS); }, []);
  return <L4Bold lang={lang} showTools />;
}
