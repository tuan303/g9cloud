import { useT } from '@/i18n';
import { Link } from 'react-router-dom';
import { Coffee } from 'lucide-react';
import { Logo } from '@/components/ui';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function NotFoundPage({ error }: { error?: boolean }) {
  const { t } = useT();
  usePageTitle(error ? t('notFound.errorTitle') : t('notFound.title'));
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-espresso px-8 text-center text-cream">
      <Logo className="mb-10 h-10 text-cream" />
      <Coffee className="mb-4 h-12 w-12 text-gold" />
      <h1 className="font-display text-xl font-bold">{error ? t('notFound.errorTitle') : t('notFound.title')}</h1>
      <p className="mt-2 text-sm text-cream/70">{error ? t('notFound.errorBody') : t('notFound.body')}</p>
      {error ? (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 rounded-2xl bg-gold px-6 py-3 font-semibold text-espresso"
        >
          {t('common.reloadApp')}
        </button>
      ) : (
        <Link to="/" className="mt-8 rounded-2xl bg-gold px-6 py-3 font-semibold text-espresso">
          {t('common.backToMenu')}
        </Link>
      )}
    </div>
  );
}
