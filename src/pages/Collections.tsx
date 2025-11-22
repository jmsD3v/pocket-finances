import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ScheduleWithDetails } from '@/types';
import PaymentDialog from '@/components/PaymentDialog';
import { differenceInDays, parseISO } from 'date-fns';

const Collections = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithDetails | undefined>();

  const fetchSchedules = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_schedule')
        .select(`
          *,
          loan:loans(
            *,
            customer:customers(*)
          )
        `)
        .eq('loan.user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      // Actualizar estados según vencimiento
      const today = new Date();
      const updatedSchedules = (data || []).map((schedule: any) => {
        if (schedule.status === 'pendiente') {
          const dueDate = parseISO(schedule.due_date);
          if (dueDate < today) {
            return { ...schedule, status: 'vencido' };
          }
        }
        return schedule;
      });

      setSchedules(updatedSchedules);
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
    fetchSchedules();
  }, [user]);

  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date();
    const due = parseISO(dueDate);
    const daysUntilDue = differenceInDays(due, today);

    if (status === 'pagado') {
      return (
        <Badge className="bg-success text-success-foreground">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Pagado
        </Badge>
      );
    }

    if (status === 'vencido' || daysUntilDue < 0) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Vencido
        </Badge>
      );
    }

    if (daysUntilDue <= 3) {
      return (
        <Badge variant="default" className="bg-warning text-warning-foreground">
          <Clock className="h-3 w-3 mr-1" />
          Por vencer
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pendiente
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR');
  };

  const handlePaymentSaved = () => {
    fetchSchedules();
    setPaymentDialogOpen(false);
    setSelectedSchedule(undefined);
  };

  const pendingSchedules = schedules.filter((s) => s.status !== 'pagado');
  const paidSchedules = schedules.filter((s) => s.status === 'pagado');

  return (
    <div className="p-4 space-y-4 max-w-screen-xl mx-auto pb-20">
      <div>
        <h2 className="text-2xl font-bold mb-1">Cobranzas</h2>
        <p className="text-sm text-muted-foreground">
          {pendingSchedules.length} cuota{pendingSchedules.length !== 1 ? 's' : ''} pendiente{pendingSchedules.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-6">
        {/* Cuotas pendientes y vencidas */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Pendientes</h3>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="p-4">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : pendingSchedules.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hay cuotas pendientes</p>
              </CardContent>
            </Card>
          ) : (
            pendingSchedules.map((schedule) => (
              <Card
                key={schedule.id}
                className="shadow-card cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedSchedule(schedule);
                  setPaymentDialogOpen(true);
                }}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{schedule.loan.customer.full_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Cuota {schedule.installment_number} de {schedule.loan.installments}
                      </p>
                    </div>
                    {getStatusBadge(schedule.status, schedule.due_date)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Monto</p>
                      <p className="font-semibold">{formatCurrency(Number(schedule.amount))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Vencimiento</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(schedule.due_date)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Historial de pagos */}
        {paidSchedules.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Historial</h3>
            {paidSchedules.map((schedule) => (
              <Card key={schedule.id} className="shadow-card opacity-75">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{schedule.loan.customer.full_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Cuota {schedule.installment_number} de {schedule.loan.installments}
                      </p>
                    </div>
                    {getStatusBadge(schedule.status, schedule.due_date)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Monto pagado</p>
                      <p className="font-semibold">{formatCurrency(Number(schedule.paid_amount || schedule.amount))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha de pago</p>
                      <p className="font-semibold">{schedule.paid_date ? formatDate(schedule.paid_date) : '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        schedule={selectedSchedule}
        onSaved={handlePaymentSaved}
      />
    </div>
  );
};

export default Collections;
