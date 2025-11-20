import { ReactNode } from 'react';
import BottomNav from './BottomNav';
import TopBar from './TopBar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background pb-16">
      <TopBar />
      <main className="pt-14">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default MainLayout;
