import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md';
  className?: string;
  pulse?: boolean;
}

const variantStyles = {
  success: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200/60 shadow-emerald-100',
  warning: 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200/60 shadow-amber-100',
  danger: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200/60 shadow-red-100',
  info: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200/60 shadow-blue-100',
  default: 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200/60 shadow-gray-100',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  pulse = false,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-semibold border shadow-sm',
        'transition-all duration-200 hover:shadow-md',
        variantStyles[variant],
        sizeStyles[size],
        pulse && 'animate-pulse',
        className
      )}
    >
      {children}
    </span>
  );
}
