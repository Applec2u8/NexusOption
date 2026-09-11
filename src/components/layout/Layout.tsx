import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { GlobalActiveTrades } from '../trade/GlobalActiveTrades';
import { GlobalWinModal } from '../trade/GlobalWinModal';

export const Layout: React.FC = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <GlobalActiveTrades />
      <GlobalWinModal />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isAdminPath && <MobileNav />}
    </div>
  );
};
