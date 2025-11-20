import { NavLink } from '@/components/NavLink';
import { Home, Users, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/customers', icon: Users, label: 'Clientes' },
    { to: '/sales', icon: TrendingUp, label: 'Ventas' },
    { to: '/loans', icon: DollarSign, label: 'Préstamos' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
