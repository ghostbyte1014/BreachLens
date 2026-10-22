import React, { useEffect, useId, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

type Policy = 'privacy' | 'terms' | null;

const POLICY_CONTENT = {
  privacy: {
    title: 'Privacy',
    body: (
      <>
        <p>BreachLens saves your results, checklist progress, and labels only on this device. You do not need to create an account.</p>
        <p>Some checks use trusted public security services. When you run a check, we send only the information needed for it—for example, your email address to look for known breaches, or part of a scrambled password code to check whether that password has been exposed.</p>
        <p>You can download a copy of your saved information or delete it at any time from the Data tab.</p>
      </>
    )
  },
  terms: {
    title: 'Terms of use',
    body: (
      <>
        <p>BreachLens helps you spot possible security problems. Its results are based on information that is publicly available at the time you run a check.</p>
        <p>A result that finds no problem does not mean that an account, password, website, or link is completely safe. Always use your best judgement and take extra care with personal or financial information.</p>
        <p>Only check information that belongs to you or that you have permission to check.</p>
      </>
    )
  }
} as const;

export const Footer: React.FC = () => {
  const [openPolicy, setOpenPolicy] = useState<Policy>(null);
  const titleId = useId();

  useEffect(() => {
    if (!openPolicy) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPolicy(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openPolicy]);

  const policy = openPolicy ? POLICY_CONTENT[openPolicy] : null;

  return (
    <>
      <footer className="border-t border-line bg-paper-alt/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-faint">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-resolve" aria-hidden="true" />
            <span>Privacy-first personal security awareness.</span>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setOpenPolicy('privacy')} className="hover:text-ink underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
              Privacy
            </button>
            <button type="button" onClick={() => setOpenPolicy('terms')} className="hover:text-ink underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
              Terms
            </button>
            <span>Maintained by Ghostbyte</span>
          </div>
        </div>
      </footer>

      {policy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
          <button type="button" aria-label="Close policy dialog" className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]" onClick={() => setOpenPolicy(null)} />
          <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative w-full max-w-lg rounded-xl border border-line bg-paper-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 id={titleId} className="font-serif text-2xl font-medium text-ink">{policy.title}</h2>
              <button type="button" aria-label="Close" onClick={() => setOpenPolicy(null)} className="rounded p-1 text-ink-faint hover:bg-paper-alt hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">{policy.body}</div>
          </section>
        </div>
      )}
    </>
  );
};
