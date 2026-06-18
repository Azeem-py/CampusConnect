import { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { cn } from '../../lib/utils';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [show, setShow] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);
  const [transitionState, setTransitionState] = useState<'offline' | 'online' | 'hidden'>('hidden');

  useEffect(() => {
    if (!isOnline) {
      setHasBeenOffline(true);
      setTransitionState('offline');
      setShow(true);
    } else if (isOnline && hasBeenOffline) {
      setTransitionState('online');
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTransitionState('hidden');
        setHasBeenOffline(false);
      }, 4000); // Show green restoration banner for 4s
      return () => clearTimeout(timer);
    }
  }, [isOnline, hasBeenOffline]);

  if (!show || transitionState === 'hidden') return null;

  const isOffline = transitionState === 'offline';

  return (
    <div
      className={cn(
        "fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md p-4 rounded-2xl backdrop-blur-xl shadow-2xl flex items-start gap-3 border transition-all duration-300 transform animate-slide-up",
        isOffline
          ? "bg-amber-500/8 dark:bg-amber-500/5 border-amber-500/20 text-amber-900 dark:text-amber-200"
          : "bg-emerald-500/8 dark:bg-emerald-500/5 border-emerald-500/20 text-emerald-900 dark:text-emerald-200"
      )}
    >
      <div
        className={cn(
          "p-2 rounded-xl shrink-0",
          isOffline
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        )}
      >
        {isOffline ? <WifiOff size={18} /> : <Wifi size={18} />}
      </div>

      <div className="flex-1 min-w-0 font-geist">
        <p className="text-[13px] font-semibold leading-tight">
          {isOffline ? "Browsing Offline" : "Connection Restored"}
        </p>
        <p className="text-[11px] opacity-80 mt-0.5 leading-normal font-inter">
          {isOffline
            ? "Logos is in offline mode. Your actions (like upvoting or posting) are queued and will sync automatically when you reconnect."
            : "You're back online! Syncing your queued offline actions with the server..."}
        </p>
      </div>

      <button
        onClick={() => setShow(false)}
        className="text-inherit opacity-50 hover:opacity-100 p-1 rounded-full transition-opacity cursor-pointer shrink-0"
        aria-label="Close connection status"
      >
        <X size={15} />
      </button>
    </div>
  );
}
