import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Download } from 'lucide-react';
import { cn } from '../../lib/utils';

export function PWARegister() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW Register Error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 sm:bottom-6 right-1/2 translate-x-1/2 sm:right-6 sm:translate-x-0 z-[100] w-[calc(100%-2rem)] max-w-sm p-4 rounded-2xl backdrop-blur-xl shadow-2xl flex items-start gap-3 border border-primary/20 bg-primary-container/10 text-on-surface transition-all duration-300 transform animate-slide-up"
      )}
    >
      <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
        <Download size={18} />
      </div>

      <div className="flex-1 min-w-0 font-geist">
        <p className="text-[13px] font-semibold text-primary dark:text-primary-dim leading-tight">
          Update Available!
        </p>
        <p className="text-[11px] opacity-80 mt-0.5 leading-normal font-inter text-on-surface-variant">
          A new version of Logos has been released. Click reload to experience the latest updates instantly!
        </p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white font-geist font-semibold text-[11px] rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <RefreshCw size={11} />
          Reload & Update
        </button>
      </div>

      <button
        onClick={() => setNeedRefresh(false)}
        className="text-on-surface-variant/60 hover:text-on-surface p-1 rounded-full transition-opacity cursor-pointer shrink-0"
        aria-label="Dismiss update"
      >
        <X size={15} />
      </button>
    </div>
  );
}
