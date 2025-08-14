import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import './adyen.css';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'E-Shop - Your Online Store',
  description: 'Best deals on electronics and more',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}