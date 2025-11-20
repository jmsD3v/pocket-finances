import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

const Loans = () => {
  return (
    <div className="p-4 space-y-4 max-w-screen-xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-1">Préstamos</h2>
        <p className="text-sm text-muted-foreground">
          Gestión de préstamos y cobranzas
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Módulo en desarrollo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Próximamente podrás crear préstamos, calcular intereses, gestionar cuotas, registrar pagos y más.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Loans;
