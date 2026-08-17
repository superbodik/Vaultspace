import { Link } from 'react-router-dom';
import { Logomark } from '@/components/layout/logomark';

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link to="/">
            <Logomark className="size-10" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-50">{title}</h1>
            <p className="mt-1 text-sm text-ink-400">{subtitle}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-surface-raised p-6 shadow-sm dark:border-ink-800">{children}</div>
        <p className="mt-6 text-center text-sm text-ink-400">{footer}</p>
      </div>
    </div>
  );
}
