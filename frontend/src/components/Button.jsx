import React from 'react';
import clsx from 'clsx';

const variants = {
  primary: 'border-brand-700 bg-brand-700 text-white hover:bg-brand-800',
  secondary: 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
  warm: 'border-earth-400 bg-earth-400 text-slate-950 hover:bg-earth-500',
  subtle: 'border-brand-100 bg-brand-50 text-brand-800 hover:bg-brand-100',
  danger: 'border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100',
  dark: 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
};

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base'
};

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  className,
  children,
  icon: Icon,
  type = 'button',
  ...props
}) {
  return (
    <Component
      type={Component === 'button' ? type : undefined}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md border font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon size={18} aria-hidden="true" />}
      {children}
    </Component>
  );
}
