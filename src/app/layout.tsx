import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { PALETTE } from '@/lib/palette';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bunsen — Science Learning Center',
  description: 'An explorable 3D chemistry lab, study hall, and greenhouse for science learning anywhere.',
};

const paletteVariables = Object.fromEntries(
  Object.entries(PALETTE).map(([name, value]) => [`--${name}`, value]),
) as CSSProperties;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        style={{
          ...paletteVariables,
          backgroundColor: PALETTE.background,
          color: PALETTE.paper,
        }}
      >
        {children}
      </body>
    </html>
  );
}
