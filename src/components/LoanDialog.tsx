import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Loan, Customer, LoanInsert, PaymentScheduleInsert, LoanDialogProps, LoanFormData, LoanCalculation } from '@/types';
import { z } from 'zod';
import { addMonths, format } from 'date-fns';

const loanSchema = z.object({
  customer_id: z.string().min(1, 'Debe seleccionar un cliente'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  interest_rate: z.number().min(0, 'El interés no puede ser negativo').max(100, 'El interés no puede ser mayor a 100'),
  installments: z.number().int().positive('Debe tener al menos 1 cuota'),
  start_date: z.string().min(1, 'Debe seleccionar una fecha'),
  status: z.enum(['activo', 'cancelado', 'moroso']),
  notes: z.string().optional(),
});

const LoanDialog = ({ open, onOpenChange, loan, onSaved }: LoanDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [formData, setFormData] = useState<LoanFormData>({
    customer_id: '',
    amount: '',
    interest_rate: '',
    installments: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'activo',
    notes: '',
  });

  useEffect(() => {
    if (open && user) {
      fetchCustomers();
    }
  }, [open, user]);

  useEffect(() => {
    if (loan) {
      setFormData({
        customer_id: loan.customer_id,
        amount: loan.amount.toString(),
        interest_rate: loan.interest_rate.toString(),
        installments: loan.installments.toString(),
        start_date: loan.start_date,
        status: loan.status as 'activo' | 'cancelado' | 'moroso',
        notes: loan.notes || '',
      });
    } else {
      setFormData({
        customer_id: '',
        amount: '',
        interest_rate: '',
        installments: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'activo',
        notes: '',
      });
    }
  }, [loan, open]);

  const fetchCustomers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('full_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const calculateLoan = (): LoanCalculation | null => {
    const amount = parseFloat(formData.amount);
    const interestRate = parseFloat(formData.interest_rate);
    const installments = parseInt(formData.installments);

    if (!amount || !installments || isNaN(interestRate)) return null;

    const totalInterest = (amount * interestRate) / 100;
    const totalAmount = amount + totalInterest;
    const installmentAmount = totalAmount / installments;

    return {
      totalAmount,
      installmentAmount,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      const parsed = loanSchema.parse({
        customer_id: formData.customer_id,
        amount: parseFloat(formData.amount),
        interest_rate: parseFloat(formData.interest_rate),
        installments: parseInt(formData.installments),
        start_date: formData.start_date,
        status: formData.status,
        notes: formData.notes,
      });

      const calculation = calculateLoan();
      if (!calculation) throw new Error('Error en el cálculo del préstamo');

      const loanData: LoanInsert = {
        user_id: user.id,
        customer_id: parsed.customer_id,
        amount: parsed.amount,
        interest_rate: parsed.interest_rate,
        installments: parsed.installments,
        installment_amount: calculation.installmentAmount,
        total_amount: calculation.totalAmount,
        start_date: parsed.start_date,
        status: parsed.status,
        notes: parsed.notes,
      };

      if (loan) {
        const { error } = await supabase
          .from('loans')
          .update(loanData)
          .eq('id', loan.id);

        if (error) throw error;

        toast({
          title: 'Préstamo actualizado',
          description: 'Los cambios se guardaron correctamente',
        });
      } else {
        const { data: newLoan, error } = await supabase
          .from('loans')
          .insert(loanData)
          .select()
          .single();

        if (error) throw error;

        // Crear cronograma de pagos
        const schedules: PaymentScheduleInsert[] = [];
        const startDate = new Date(parsed.start_date);

        for (let i = 1; i <= parsed.installments; i++) {
          const dueDate = addMonths(startDate, i);
          schedules.push({
            loan_id: newLoan.id,
            installment_number: i,
            due_date: format(dueDate, 'yyyy-MM-dd'),
            amount: calculation.installmentAmount,
            status: 'pendiente',
          });
        }

        const { error: scheduleError } = await supabase
          .from('payment_schedule')
          .insert(schedules);

        if (scheduleError) throw scheduleError;

        toast({
          title: 'Préstamo creado',
          description: 'El préstamo y su cronograma se crearon correctamente',
        });
      }

      onSaved();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Hubo un error al guardar el préstamo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!loan) return;

    try {
      setLoading(true);

      // Eliminar cronograma de pagos
      await supabase.from('payment_schedule').delete().eq('loan_id', loan.id);
      
      // Eliminar pagos
      await supabase.from('payments').delete().eq('loan_id', loan.id);

      // Eliminar préstamo
      const { error } = await supabase.from('loans').delete().eq('id', loan.id);

      if (error) throw error;

      toast({
        title: 'Préstamo eliminado',
        description: 'El préstamo se eliminó correctamente',
      });

      onSaved();
      setDeleteDialogOpen(false);
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

  const calculation = calculateLoan();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{loan ? 'Editar Préstamo' : 'Nuevo Préstamo'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer_id">Cliente *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                disabled={!!loan}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="interest_rate">Interés (%) *</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installments">Cuotas *</Label>
                <Input
                  id="installments"
                  type="number"
                  value={formData.installments}
                  onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Fecha inicio *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
            </div>

            {calculation && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monto total:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS',
                    }).format(calculation.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor cuota:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS',
                    }).format(calculation.installmentAmount)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'activo' | 'cancelado' | 'moroso') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="moroso">Moroso</SelectItem>
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

            <DialogFooter className="gap-2">
              {loan && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                >
                  Eliminar
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar préstamo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los pagos y el cronograma asociado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LoanDialog;
