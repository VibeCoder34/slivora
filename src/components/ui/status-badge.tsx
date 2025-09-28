import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'draft' | 'generating' | 'ready' | 'error'
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    draft: {
      label: 'Draft',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    generating: {
      label: 'Generating',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    ready: {
      label: 'Ready',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    error: {
      label: 'Error',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
