import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Brand from '../components/Brand';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fbf8f1] px-4">
      <Card className="max-w-md p-8 text-center">
        <div className="flex justify-center">
          <Brand />
        </div>
        <p className="mt-6 text-sm font-semibold text-brand-700">404</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-slate-950">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">The route you opened is not part of the Arogya Rural workspace.</p>
        <Button as={Link} to="/" className="mt-5">
          Go home
        </Button>
      </Card>
    </div>
  );
}
