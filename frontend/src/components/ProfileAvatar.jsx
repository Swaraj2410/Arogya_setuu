import React from 'react';
import clsx from 'clsx';

export default function ProfileAvatar({ name = 'User', role, size = 'md' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizes = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base'
  };

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-md bg-brand-100 font-semibold text-brand-800',
        sizes[size]
      )}
      aria-label={`${name}${role ? `, ${role}` : ''}`}
    >
      {initials || 'AR'}
    </span>
  );
}
