import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon: LucideIcon;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const colorConfig = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    iconBg: 'bg-white/20',
    light: 'from-blue-50 to-indigo-50',
    border: 'border-blue-100',
    text: 'text-blue-600',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    iconBg: 'bg-white/20',
    light: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-100',
    text: 'text-emerald-600',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    iconBg: 'bg-white/20',
    light: 'from-amber-50 to-orange-50',
    border: 'border-amber-100',
    text: 'text-amber-600',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-500 to-rose-600',
    iconBg: 'bg-white/20',
    light: 'from-red-50 to-rose-50',
    border: 'border-red-100',
    text: 'text-red-600',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-500 to-violet-600',
    iconBg: 'bg-white/20',
    light: 'from-purple-50 to-violet-50',
    border: 'border-purple-100',
    text: 'text-purple-600',
  },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  color = 'blue',
}: StatCardProps) {
  const config = colorConfig[color];

  return (
    <div className={clsx(
      'relative overflow-hidden rounded-2xl p-6 transition-all duration-300',
      'bg-white/80 backdrop-blur-sm border shadow-lg hover:shadow-xl hover:-translate-y-1',
      config.border
    )}>
      {/* Background decoration */}
      <div className={clsx(
        'absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10',
        config.bg
      )} />
      <div className={clsx(
        'absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-5',
        config.bg
      )} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className={clsx('mt-3 text-4xl font-bold', config.text)}>{value}</p>
          {change && (
            <div className={clsx(
              'mt-3 flex items-center gap-1.5 text-sm font-medium',
              changeType === 'increase' && 'text-emerald-600',
              changeType === 'decrease' && 'text-red-500',
              changeType === 'neutral' && 'text-gray-500'
            )}>
              {changeType === 'increase' && <TrendingUp className="h-4 w-4" />}
              {changeType === 'decrease' && <TrendingDown className="h-4 w-4" />}
              {changeType === 'neutral' && <Minus className="h-4 w-4" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={clsx(
          'p-4 rounded-2xl shadow-lg',
          config.bg
        )}>
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
    </div>
  );
}
