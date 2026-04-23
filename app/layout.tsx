import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@/styles/globals.scss';

export const metadata: Metadata = {
  title: 'Advisor Listings',
  description:
    'Production-quality advisor listings built with Next.js, TypeScript, and SCSS Modules.'
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
