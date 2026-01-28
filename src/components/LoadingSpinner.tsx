import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

const borderClasses = {
  sm: 'border-2',
  md: 'border-3',
  lg: 'border-4',
};

export default function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Outer glow */}
        <div
          className={clsx(
            'absolute inset-0 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 blur-lg opacity-30 animate-pulse',
            sizeClasses[size]
          )}
        />
        {/* Spinner */}
        <div
          className={clsx(
            'relative animate-spin rounded-full bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500',
            sizeClasses[size],
            borderClasses[size],
            className
          )}
          style={{
            background: 'conic-gradient(from 0deg, #6366f1, #a855f7, #ec4899, transparent)',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
          }}
        />
        {/* Center dot */}
        <div
          className={clsx(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary-500 to-purple-500',
            size === 'sm' && 'w-1.5 h-1.5',
            size === 'md' && 'w-2.5 h-2.5',
            size === 'lg' && 'w-4 h-4'
          )}
        />
      </div>
      {text && (
        <p className="text-sm font-medium text-gray-500 animate-pulse">{text}</p>
      )}
    </div>
  );
}
