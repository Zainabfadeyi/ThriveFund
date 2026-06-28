'use client';

import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PublicCopyButton({ text }: { text: string }) {
  return (
    <Button variant="outline" onClick={() => navigator.clipboard.writeText(text)}>
      <Copy className="h-4 w-4" /> Copy Account Number
    </Button>
  );
}
