import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Customer, CustomerStatus, CustomerDialogProps, CustomerFormData } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const customerSchema = z.object({
  full_name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().trim().email('Email inválido').max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  identification_number: z.string().trim().max(50).optional().or(z.literal('')),
  status: z.enum(['activo', 'moroso', 'inactivo']),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

const CustomerDialog = ({ open, onOpenChange, customer, onSaved }: CustomerDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    identification_number: '',
    status: 'activo',
    notes: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        full_name: customer.full_name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        identification_number: customer.identification_number || '',
        status: customer.status,
        notes: customer.notes || '',
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        identification_number: '',
        status: 'activo',
        notes: '',
      });
    }
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = customerSchema.parse(formData);
      setLoading(true);

      const dataToSave = {
        ...validated,
        email: validated.email || null,
        phone: validated.phone || null,
        address: validated.address || null,
        identification_number: validated.identification_number || null,
        notes: validated.notes || null,
      };

      if (customer) {
        const { error } = await supabase
          .from('customers')
          .update(dataToSave)
          .eq('id', customer.id);

        if (error) throw error;
        toast.success('Cliente actualizado');
      } else {
        const { error } = await supabase
          .from('customers')
          .insert({
            full_name: validated.full_name,
            email: validated.email || null,
            phone: validated.phone || null,
            address: validated.address || null,
            identification_number: validated.identification_number || null,
            status: validated.status,
            notes: validated.notes || null,
            user_id: user!.id,
          });

        if (error) throw error;
        toast.success('Cliente creado');
      }

      onSaved();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('Error al guardar cliente');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id);

      if (error) throw error;
      
      toast.success('Cliente eliminado');
      setDeleteDialogOpen(false);
      onSaved();
    } catch (error) {
      toast.error('Error al eliminar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {customer 
                ? 'Actualiza la información del cliente' 
                : 'Completa los datos del nuevo cliente'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="identification_number">DNI / Documento</Label>
              <Input
                id="identification_number"
                value={formData.identification_number}
                onChange={(e) => setFormData({ ...formData, identification_number: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
            <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={loading}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="moroso">Moroso</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
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
                disabled={loading}
              />
            </div>

            <DialogFooter className="gap-2">
              {customer && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {customer ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CustomerDialog;
