import React from 'react';
import clsx from 'clsx';

export default function Card({ as: Component = 'div', className, children }) {
  return (
    <Component className={clsx('rounded-lg border border-slate-200 bg-white shadow-card', className)}>
      {children}
    </Component>
  );
}
