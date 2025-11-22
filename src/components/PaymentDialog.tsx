import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { PaymentSchedule, Loan, Customer, PaymentInsert } from '@/types/database';
import { z } from 'zod';
import { format } from 'date-fns';

const paymentSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0'),
  payment_date: z.string().min(1, 'Debe seleccionar una fecha'),
  payment_method: z.enum(['efectivo', 'transferencia', 'tarjeta']),
  notes: z.string().optional(),
});

type ScheduleWithDetails = PaymentSchedule & {
  loan: Loan & { customer: Customer };
};

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: ScheduleWithDetails;
  onSaved: () => void;
}

const PaymentDialog = ({ open, onOpenChange, schedule, onSaved }: PaymentDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'efectivo' as const,
    notes: '',
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        amount: schedule.amount,
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'efectivo',
        notes: '',
      });
    }
  }, [schedule, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !schedule) return;

    try {
      setLoading(true);

      const parsed = paymentSchema.parse({
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        notes: formData.notes,
      });

      // Registrar pago
      const paymentData: PaymentInsert = {
        user_id: user.id,
        loan_id: schedule.loan_id,
        customer_id: schedule.loan.customer_id,
        amount: parsed.amount.toString(),
        payment_date: parsed.payment_date,
        payment_method: parsed.payment_method,
        installment_number: schedule.installment_number,
        notes: parsed.notes,
      };

      const { error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData);

      if (paymentError) throw paymentError;

      // Actualizar cronograma
      const { error: scheduleError } = await supabase
        .from('payment_schedule')
        .update({
          status: 'pagado',
          paid_amount: parsed.amount.toString(),
          paid_date: parsed.payment_date,
        })
        .eq('id', schedule.id);

      if (scheduleError) throw scheduleError;

      // Verificar si todas las cuotas están pagadas
      const { data: allSchedules } = await supabase
        .from('payment_schedule')
        .select('status')
        .eq('loan_id', schedule.loan_id);

      const allPaid = allSchedules?.every((s) => s.status === 'pagado');

      if (allPaid) {
        await supabase
          .from('loans')
          .update({ status: 'cancelado' })
          .eq('id', schedule.loan_id);
      }

      toast({
        title: 'Pago registrado',
        description: 'El pago se registró correctamente',
      });

      onSaved();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Hubo un error al registrar el pago',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  if (!schedule) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4 border-y border-border">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cliente:</span>
            <span className="font-semibold">{schedule.loan.customer.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cuota:</span>
            <span className="font-semibold">
              {schedule.installment_number} de {schedule.loan.installments}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monto a pagar:</span>
            <span className="font-semibold">{formatCurrency(Number(schedule.amount))}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">Fecha de pago *</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de pago *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) =>
                setFormData({ ...formData, payment_method: value as 'efectivo' | 'transferencia' | 'tarjeta' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
