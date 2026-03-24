import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";

import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";

export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  // Em modo DEV, mostramos o erro na tela em vez de relançar (que causaria tela branca)
  // if (import.meta.env.DEV) throw error;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangleIcon />
          <AlertTitle>Erro na aplicação</AlertTitle>
          <AlertDescription>
            Ocorreu um erro inesperado. Veja os detalhes abaixo e tente novamente.
          </AlertDescription>
        </Alert>
        
        <div className="bg-card border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">Detalhes do Erro:</h3>
          <pre className="text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto max-h-64">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </div>
        
        <Button 
          onClick={resetErrorBoundary} 
          className="w-full"
          variant="outline"
        >
          <RefreshCwIcon />
          Tentar Novamente
        </Button>
      </div>
    </div>
  );
}
