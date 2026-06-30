// ============================================================================
// Themed confirm dialog — a promise-based replacement for window.confirm().
// Reuses the app's .modal-bg / .modal-card / .btn styles plus a .confirm-card
// variant (theme.css) so it reads on-brand on any surface. The provider renders
// above the app shell (not inside .dash), so the variant is self-contained and
// must not depend on the surface's CSS-var scope.
//
//   const confirm = useConfirm();
//   if (await confirm({ title: t('delWarn'), confirmLabel: t('del'), danger: true })) …
// ============================================================================
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export type ConfirmOptions = {
  title: ReactNode;
  message?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  /** Red confirm button + cancel-focused, for destructive actions. */
  danger?: boolean;
};

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const Ctx = createContext<ConfirmFn>(async () => false);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const settle = useCallback((v: boolean) => {
    resolver.current?.(v);
    resolver.current = null;
    setOpts(null);
  }, []);

  const confirm = useCallback<ConfirmFn>((o) => {
    // Settle any dialog still in flight as cancelled, so its awaiting promise never hangs
    // if confirm() is called again before the previous one was answered.
    resolver.current?.(false);
    setOpts(o);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  // Escape cancels. We deliberately don't bind Enter→confirm: for a destructive
  // dialog the Cancel button is focused, so a stray keypress never deletes.
  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') settle(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opts, settle]);

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {opts && (
        <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) settle(false); }}>
          <div className="modal-card confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
            <h3 id="confirm-title">{opts.title}</h3>
            {opts.message != null && <div className="ph">{opts.message}</div>}
            <div className="modal-actions">
              <button className="btn ghost" autoFocus={opts.danger} onClick={() => settle(false)}>
                {opts.cancelLabel ?? 'Cancel'}
              </button>
              <button className={'btn' + (opts.danger ? ' danger' : '')} autoFocus={!opts.danger} onClick={() => settle(true)}>
                {opts.confirmLabel ?? 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export const useConfirm = () => useContext(Ctx);
