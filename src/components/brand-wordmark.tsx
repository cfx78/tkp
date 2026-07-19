import type { HTMLAttributes } from 'react';

type BrandWordmarkVariant = 'compact' | 'standard' | 'title-card';

export function BrandWordmark({ variant = 'standard', className = '', ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BrandWordmarkVariant }) {
  return (
    <span className={`brand-wordmark brand-wordmark--${variant} ${className}`.trim()} data-text="THE KITSUNE PROTOCOL" {...props}>
      THE KITSUNE PROTOCOL
    </span>
  );
}
