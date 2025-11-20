import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  overdueCustomers: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: customers } = await supabase
          .from('customers')
          .select('status');

        if (customers) {
          const total = customers.length;
          const active = customers.filter(c => c.status === 'activo').length;
          const overdue = customers.filter(c => c.status === 'moroso').length;

          setStats({
            totalCustomers: total,
            activeCustomers: active,
            overdueCustomers: overdue,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    variant = 'default' 
  }: { 
    icon: any; 
    title: string; 
    value: number;
    variant?: 'default' | 'success' | 'warning' 
  }) => {
    const variantClasses = {
      default: 'bg-primary/10 text-primary',
      success: 'bg-success/10 text-success',
      warning: 'bg-accent/10 text-accent',
    };

    return (
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${variantClasses[variant]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-bold">{value}</div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 space-y-6 max-w-screen-xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-1">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen de tu gestión financiera
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          title="Total Clientes"
          value={stats?.totalCustomers ?? 0}
          variant="default"
        />
        <StatCard
          icon={TrendingUp}
          title="Clientes Activos"
          value={stats?.activeCustomers ?? 0}
          variant="success"
        />
        <StatCard
          icon={AlertCircle}
          title="Clientes Morosos"
          value={stats?.overdueCustomers ?? 0}
          variant="warning"
        />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Próximamente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aquí verás métricas de ventas, préstamos activos, cobranzas pendientes y más estadísticas importantes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
