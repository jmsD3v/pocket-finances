import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const Sales = () => {
  return (
    <div className="p-4 space-y-4 max-w-screen-xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-1">Ventas</h2>
        <p className="text-sm text-muted-foreground">
          Gestión de ventas y facturación
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            Módulo en desarrollo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Próximamente podrás registrar ventas, gestionar productos, generar comprobantes y más.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;
