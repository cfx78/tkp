import type { HTMLAttributes } from 'react';

type EditorialVariant = 'section' | 'phase' | 'subtitle' | 'extruded';

export function EditorialDisplayTitle({ children, subtitle, variant = 'section', className = '', ...props }: HTMLAttributes<HTMLHeadingElement> & { subtitle?: string; variant?: EditorialVariant }) {
  const text = typeof children === 'string' ? children : undefined;
  return (
    <h2 className={`editorial-display-title editorial-display-title--${variant} ${className}`.trim()} data-text={text} {...props}>
      <span>{children}</span>
      {subtitle ? <small>{subtitle}</small> : null}
    </h2>
  );
}
