import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ServerSense AI — Server Room Monitoring & Overheating Prevention System',
  description:
    'Engineering dashboard for server-room environmental telemetry, overheating risk detection, combustible gas monitoring, and greenhouse emissions estimation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-[#0B1120] text-slate-100 antialiased">
      <head>
        <meta name="theme-color" content="#0B1120" />
      </head>
      <body className="min-h-screen bg-[#0B1120] text-slate-100">{children}</body>
    </html>
  );
}
