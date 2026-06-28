import { Info } from 'lucide-react';

export function MockDataBanner() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
      <Info className="h-4 w-4 shrink-0" />
      <span>
        <strong>Mock data mode.</strong> Virtual accounts and payments are simulated. Live Nomba integration begins July 1.
      </span>
    </div>
  );
}
