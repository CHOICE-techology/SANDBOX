import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { ChoiceButton } from './ChoiceButton';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-foreground">
          <div className="max-w-md w-full p-8 border border-destructive/20 rounded-2xl bg-destructive/5 backdrop-blur-sm transition-all animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-6 mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h1 className="text-2xl font-bold text-center mb-2">Something went wrong</h1>
            <p className="text-muted-foreground text-center mb-8">
              The application encountered an unexpected error. Don't worry, your local data is safe.
            </p>

            {this.state.error && (
              <div className="p-4 bg-background/50 rounded-lg border border-border text-xs font-mono mb-8 overflow-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <ChoiceButton 
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload Application
            </ChoiceButton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
