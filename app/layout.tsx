import './globals.css';
import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const sora = Sora({ subsets: ['latin'], variable: '--font-sora', weight: ['600', '700'] });

export const metadata: Metadata = { title: 'Mausam · Your weather, your way', description: 'A personalized view of India’s national weather data.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={`${inter.variable} ${sora.variable}`}>{children}</body></html>;
}
