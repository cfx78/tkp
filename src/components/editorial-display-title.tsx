import type { HTMLAttributes } from 'react';

type EditorialVariant = 'section' | 'phase' | 'subtitle' | 'extruded';

export function EditorialDisplayTitle({ children, subtitle, variant = 'section', level = 2, className = '', ...props }: HTMLAttributes<HTMLHeadingElement> & { subtitle?: string; variant?: EditorialVariant; level?: 1 | 2 }) {
  const text = typeof children === 'string' ? children : undefined;
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <Heading className={`editorial-display-title editorial-display-title--${variant} ${className}`.trim()} data-text={text} {...props}>
      <span>{children}</span>
      {subtitle ? <small>{subtitle}</small> : null}
    </Heading>
  );
}
