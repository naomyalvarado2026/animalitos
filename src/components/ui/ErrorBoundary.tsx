import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6 border border-amber-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="font-heading text-2xl font-bold text-[var(--color-foreground)] mb-3">
            Algo no salió como esperábamos
          </h2>

          <p className="text-[var(--color-muted-foreground)] max-w-md mb-8 leading-relaxed text-sm">
            {this.props.fallbackMessage ||
              'Ocurrió un problema temporal al cargar este componente. Hemos registrado el incidente para solucionarlo.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={this.handleReset} variant="warm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </Button>
            <Button onClick={this.handleGoHome} variant="outline" className="gap-2">
              <Home className="w-4 h-4" />
              Volver al Inicio
            </Button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <div className="mt-8 p-4 max-w-xl text-left bg-destructive/10 text-destructive text-xs rounded-xl overflow-x-auto border border-destructive/20">
              <p className="font-semibold mb-1">{this.state.error.toString()}</p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
