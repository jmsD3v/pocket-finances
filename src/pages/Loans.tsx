import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, DollarSign, Calendar, TrendingUp, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Loan, Customer } from '@/types/database';
import LoanDialog from '@/components/LoanDialog';

const Loans = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<(Loan & { customer: Customer })[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<(Loan & { customer: Customer })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | undefined>();

  const fetchLoans = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('loans')
        .select('*, customer:customers(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
      setFilteredLoans(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [user]);

  useEffect(() => {
    const filtered = loans.filter(
      (loan) =>
        loan.customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.customer.identification_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLoans(filtered);
  }, [searchTerm, loans]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      activo: 'default',
      moroso: 'destructive',
      cancelado: 'secondary',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const handleLoanSaved = () => {
    fetchLoans();
    setDialogOpen(false);
    setSelectedLoan(undefined);
  };

  return (
    <div className="p-4 space-y-4 max-w-screen-xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Préstamos</h2>
          <p className="text-sm text-muted-foreground">
            {loans.length} préstamo{loans.length !== 1 ? 's' : ''} registrado{loans.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Préstamo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-card">
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredLoans.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No se encontraron préstamos' : 'No hay préstamos registrados'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLoans.map((loan) => (
            <Card
              key={loan.id}
              className="shadow-card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setSelectedLoan(loan);
                setDialogOpen(true);
              }}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{loan.customer.full_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {loan.customer.identification_number}
                    </p>
                  </div>
                  {getStatusBadge(loan.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Monto total</p>
                      <p className="font-semibold">{formatCurrency(Number(loan.total_amount))}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cuota</p>
                      <p className="font-semibold">{formatCurrency(Number(loan.installment_amount))}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cuotas</p>
                      <p className="font-semibold">{loan.installments} cuotas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Interés</p>
                      <p className="font-semibold">{loan.interest_rate}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <LoanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        loan={selectedLoan}
        onSaved={handleLoanSaved}
      />
    </div>
  );
};

export default Loans;
