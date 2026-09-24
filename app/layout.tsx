import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jewellery Stumper Dataset Collector',
  description: 'Collect catalogue and real-world jewellery stumper images.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
