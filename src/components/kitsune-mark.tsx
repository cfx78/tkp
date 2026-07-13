/**
 * Reserved slot for the approved Kitsune mask artwork.
 *
 * Phase 0 found no authoritative mask asset in the repository. This component
 * deliberately renders no invented fox geometry. Replace its empty contents
 * only after an approved solid/monoline asset is supplied, preserving one
 * shared proportion system for both variants.
 */
export function KitsuneMark({ variant = 'solid', className }: { variant?: 'solid' | 'monoline'; className?: string }) {
  return <span aria-hidden="true" className={className} data-kitsune-mark-slot="unavailable" data-variant={variant} />;
}
