import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  noPadding?: boolean;
}

export default function Card({ children, className, title, subtitle, action, noPadding = false }: CardProps) {
  return (
    <div className={clsx(
      'bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50',
      'transition-all duration-300 hover:shadow-2xl',
      !noPadding && 'p-6',
      className
    )}>
      {(title || action) && (
        <div className={clsx(
          'flex items-center justify-between',
          noPadding ? 'px-6 pt-6 pb-4' : 'mb-6'
        )}>
          <div>
            {title && (
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-purple-500 rounded-full"></span>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1 ml-3">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
  );
}
