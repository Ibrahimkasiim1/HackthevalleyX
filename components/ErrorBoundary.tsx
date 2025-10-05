import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Navigation Error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
}

function DefaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <ThemedView style={styles.container}>
      <View style={styles.errorContainer}>
        <IconSymbol 
          name="chevron.left.forwardslash.chevron.right" 
          size={64} 
          color="#ff6b6b" 
          style={styles.errorIcon}
        />
        
        <ThemedText style={styles.errorTitle}>Oops! Something went wrong</ThemedText>
        
        <ThemedText style={styles.errorMessage}>
          {error.message || 'An unexpected error occurred while loading the navigation.'}
        </ThemedText>

        <View style={styles.errorDetails}>
          <ThemedText style={styles.errorDetailsTitle}>Error Details:</ThemedText>
          <Text style={[styles.errorDetailsText, { color: textColor }]}>
            {error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : error.toString()}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: tintColor }]}
          onPress={retry}
        >
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.reportButton}
          onPress={() => {
            Alert.alert(
              'Report Issue',
              'Please contact support with the error details above.',
              [
                { text: 'OK', style: 'default' },
                { 
                  text: 'Copy Error', 
                  onPress: () => {
                    // In a real app, you'd use Clipboard here
                    console.log('Error copied:', error.toString());
                  }
                }
              ]
            );
          }}
        >
          <ThemedText style={[styles.reportButtonText, { color: tintColor }]}>
            Report Issue
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

// Common error types for navigation
export class NavigationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'NavigationError';
  }
}

export class LocationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'LocationError';
  }
}

export class RouteError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'RouteError';
  }
}

// Error handling utilities
export const handleNavigationError = (error: any): string => {
  console.error('Navigation error:', error);
  
  if (error instanceof LocationError) {
    return 'Unable to access your location. Please check your location permissions and try again.';
  }
  
  if (error instanceof RouteError) {
    return 'Unable to build route. Please check your start and destination locations.';
  }
  
  if (error instanceof NavigationError) {
    return error.message;
  }
  
  // Network errors
  if (error.message?.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  // Default error message
  return 'An unexpected error occurred. Please try again.';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: 400,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.7,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reportButtonText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});