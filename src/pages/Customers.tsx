import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Customer } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Phone, Mail, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import CustomerDialog from '@/components/CustomerDialog';

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCustomers(data || []);
      setFilteredCustomers(data || []);
    } catch (error: any) {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const handleCustomerSaved = () => {
    fetchCustomers();
    setDialogOpen(false);
    setSelectedCustomer(undefined);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      activo: 'default',
      moroso: 'destructive',
      inactivo: 'secondary',
    };
    
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-4 space-y-4 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Clientes</h2>
          <p className="text-sm text-muted-foreground">
            {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          onClick={() => {
            setSelectedCustomer(undefined);
            setDialogOpen(true);
          }}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-20 w-full" />
            </Card>
          ))
        ) : filteredCustomers.length === 0 ? (
          <Card className="p-8 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No se encontraron clientes' : 'Aún no tienes clientes'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setDialogOpen(true)} 
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar primer cliente
              </Button>
            )}
          </Card>
        ) : (
          filteredCustomers.map((customer) => (
            <Card 
              key={customer.id} 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedCustomer(customer);
                setDialogOpen(true);
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{customer.full_name}</h3>
                  {customer.identification_number && (
                    <p className="text-sm text-muted-foreground">
                      {customer.identification_number}
                    </p>
                  )}
                </div>
                {getStatusBadge(customer.status)}
              </div>
              
              <div className="space-y-1">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {customer.phone}
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={selectedCustomer}
        onSaved={handleCustomerSaved}
      />
    </div>
  );
};

export default Customers;
