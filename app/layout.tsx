import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Proxy — Everything an Engineering Student Needs',
  description: 'Everything an engineering student needs, unified on a single platform. Notes, modules, question papers, and high-impact learning paths.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-[#050505] text-slate-200 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
