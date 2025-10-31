import './globals.css'
import AppHeader from './_components/AppHeader';

export const metadata = {
  title: 'Tiko ITSM',
  description: 'ITSM tool with hierarchical categories and tickets',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-secondary-50 text-secondary-900">
        <AppHeader />
        <div className="h-14" />
        {children}
      </body>
    </html>
  );
}
