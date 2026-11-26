import React from 'react';

// -------------------------------------------------------------
// Enterprise Button Component
// -------------------------------------------------------------
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ElementType;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B1120] disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs px-3.5 py-2 gap-2',
    lg: 'text-sm px-4 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#FF8A3D] hover:bg-[#FF9B57] text-white shadow-sm shadow-[#FF8A3D]/20 focus:ring-[#FF8A3D]',
    secondary:
      'bg-[#1C293B] hover:bg-[#243447] text-[#F8FAFC] border border-[#243447] focus:ring-[#A6B2C3]',
    outline:
      'bg-transparent hover:bg-[#151F30] text-[#A6B2C3] hover:text-[#F8FAFC] border border-[#1E293B] focus:ring-[#FF8A3D]',
    danger:
      'bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 focus:ring-[#EF4444]',
    ghost:
      'bg-transparent hover:bg-[#151F30] text-[#A6B2C3] hover:text-[#F8FAFC] focus:ring-slate-700',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

// -------------------------------------------------------------
// Enterprise Card Component
// -------------------------------------------------------------
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'elevated' | 'glass';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'surface',
  hoverable = false,
  children,
  className = '',
  ...props
}) => {
  const base = 'rounded-2xl border p-5 sm:p-6 transition-all duration-200';
  const variants = {
    surface: 'bg-[#151F30] border-[#243447]',
    elevated: 'bg-[#1C293B] border-[#2E4057] shadow-lg shadow-black/20',
    glass: 'bg-[#151F30]/80 backdrop-blur-md border-[#243447]',
  };
  const hover = hoverable ? 'hover:border-[#FF8A3D]/40 hover:shadow-md' : '';

  return (
    <div className={`${base} ${variants[variant]} ${hover} ${className}`} {...props}>
      {children}
    </div>
  );
};

// -------------------------------------------------------------
// Enterprise StatCard Component
// -------------------------------------------------------------
export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'text-[#FF8A3D]',
}) => {
  return (
    <Card hoverable className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-[#718096] uppercase tracking-wider">
            {title}
          </span>
          <div className="p-2 rounded-xl bg-[#111827] border border-[#1E293B]">
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">{value}</span>
          {trend && (
            <span
              className={`text-xs font-bold ${
                trend.isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="text-[11px] text-[#A6B2C3] mt-3 pt-2.5 border-t border-[#1E293B]">
          {subtitle}
        </p>
      )}
    </Card>
  );
};

// -------------------------------------------------------------
// Enterprise Badge Component
// -------------------------------------------------------------
export interface BadgeProps {
  variant?: 'orange' | 'green' | 'amber' | 'blue' | 'purple' | 'red' | 'gray';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'gray', children, className = '' }) => {
  const variants = {
    orange: 'bg-[#FF8A3D]/10 text-[#FF8A3D] border-[#FF8A3D]/20',
    green: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20',
    amber: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
    blue: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    red: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20',
    gray: 'bg-[#1C293B] text-[#A6B2C3] border-[#243447]',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// -------------------------------------------------------------
// Enterprise Page Header
// -------------------------------------------------------------
export interface PageHeaderProps {
  badge?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  badge,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-6 mb-8">
      <div className="space-y-1">
        {badge && (
          <Badge variant="orange" className="mb-1">
            {badge}
          </Badge>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-[#A6B2C3] max-w-2xl">{description}</p>
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
};
