import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthContext';
import { ThemeProvider } from '@/components/ThemeContext';

export const metadata: Metadata = {
  title: 'ClientHunt AI — Autonomous Client Discovery & Outreach',
  description: 'Enterprise-grade zero-cost AI client acquisition engine',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
