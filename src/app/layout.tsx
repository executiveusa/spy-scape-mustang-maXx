import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mustang Maxx 006 | MACS Digital Media',
  description: 'Agent 006 of the Yappyverse. Where awareness goes, energy flows.',
  keywords: ['mustang maxx', 'agent 006', 'yappyverse', 'macs digital media', 'focus'],
  authors: [{ name: 'MACS Digital Media' }],
  openGraph: {
    title: 'Mustang Maxx 006',
    description: 'Agent 006 of the Yappyverse. Where awareness goes, energy flows.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
