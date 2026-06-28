import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'white';
}

export function Logo({ className, variant = 'default' }: LogoProps) {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      <span className={cn('text-lg font-bold tracking-tight', variant === 'white' ? 'text-white' : 'text-thrive-dark')}>
        ThriveFund
      </span>
    </Link>
  );
}
