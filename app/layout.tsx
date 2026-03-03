import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Variations – Made By Mobbs',
  description: 'Submit and approve variation requests',
};

export const viewport = { themeColor: '#166534' };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <header className="border-b border-green-100 bg-white">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
            <span className="text-xl font-semibold text-green-800">
              Made By Mobbs
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600">Variations</span>
          </div>
        </header>
        <main className="min-h-[calc(100vh-56px)] bg-white">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
