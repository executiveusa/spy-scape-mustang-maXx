import type { Metadata } from 'next';
import Navbar from '@/components/ui/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'SpyScape - Mustang Maxx 006 | Elite Spy Training Experience',
  description: 'Enter the world of elite espionage training. Master the skills of a secret agent with cutting-edge simulations and interactive challenges.',
  keywords: ['spy', 'training', 'espionage', 'mission', 'agent', '007', 'mustang maxx'],
  authors: [{ name: 'Mustang Maxx 006' }],
  openGraph: {
    title: 'SpyScape - Elite Spy Training Experience',
    description: 'Master the skills of a secret agent with cutting-edge simulations.',
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
      <body className="antialiased">
        <Navbar />
        <div className="grid-overlay" />
        {children}
      </body>
    </html>
  );
}
