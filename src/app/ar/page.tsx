'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * The standalone AR page has been merged into the main app.
 * AR mode is now toggled directly from the main view via the AR toggle button.
 * Redirect users who land here back to the main page.
 */
export default function ARPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="fixed inset-0 bg-[#020408] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-500/50 border-t-cyan-400 animate-spin mx-auto mb-3" />
        <p className="text-sm text-cyan-400">Redirecting to AR mode...</p>
      </div>
    </div>
  );
}
