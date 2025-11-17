import { Badge } from '@/components/ui/badge';
import { Event } from '@/lib/types';

interface EventStatusBadgeProps {
  status: Event['status'];
}

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  const variants: Record<Event['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
    draft: {
      variant: 'outline',
      className: 'bg-gray-50 text-gray-700 border-gray-200',
    },
    scheduled: {
      variant: 'default',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    live: {
      variant: 'default',
      className: 'bg-green-50 text-green-700 border-green-200',
    },
    past: {
      variant: 'secondary',
      className: 'bg-gray-100 text-gray-600',
    },
    archived: {
      variant: 'outline',
      className: 'bg-gray-50 text-gray-500 border-gray-300',
    },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

