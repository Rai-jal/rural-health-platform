"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

// Optional Sentry import - app works even if Sentry isn't installed
let Sentry: any = null
try {
  Sentry = require("@sentry/nextjs")
} catch (e) {
  // Sentry not installed - that's okay
}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  boundaryName?: string; // Name for identifying which boundary caught the error
  showErrorDetails?: boolean; // Whether to show error details to user
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture error with Sentry (if available)
    if (Sentry?.captureException) {
      Sentry.captureException(error, {
        tags: {
          errorBoundary: this.props.boundaryName || "unknown",
          component: "ErrorBoundary",
        },
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        extra: {
          errorInfo,
        },
      });
    }

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-600">Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && this.props.showErrorDetails && (
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p className="font-medium text-gray-700">Error details:</p>
                  <p className="text-gray-600 mt-1">{this.state.error.message}</p>
                </div>
              )}
              {!this.props.showErrorDetails && (
                <p className="text-sm text-muted-foreground">
                  The error has been reported and our team has been notified.
                </p>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleReset} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = "/dashboard"}
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

