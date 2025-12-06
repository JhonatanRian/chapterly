import { cn } from '@/utils/cn';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="ml-64 transition-all duration-300">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className={cn('p-6', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
