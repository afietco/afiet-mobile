import * as Sentry from '@sentry/react-native'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { Component, Fragment, type ErrorInfo, type ReactNode, useEffect } from 'react'
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
  retryKey: number
}

type ErrorFallbackProps = {
  onRetry: () => void
}

function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  const isDark = useColorScheme() === 'dark'
  const palette = isDark
    ? {
        background: '#020617',
        surface: '#0f172a',
        border: '#334155',
        text: '#f1f5f9',
        secondaryText: '#94a3b8',
      }
    : {
        background: '#f8fafc',
        surface: '#ffffff',
        border: '#e2e8f0',
        text: '#1e293b',
        secondaryText: '#64748b',
      }

  useEffect(() => {
    void SplashScreen.hideAsync()
  }, [])

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.afiMark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={styles.afiMarkText}>afi</Text>
        </View>
        <Text accessibilityRole="alert" style={[styles.title, { color: palette.text }]}>
          Afi bir anlığına takıldı.
        </Text>
        <Text style={[styles.message, { color: palette.secondaryText }]}>
          Ekranı yeniden açmayı deneyebiliriz. Sorun sürerse uygulamayı kapatıp tekrar aç.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ekranı yeniden açmayı dene"
          onPress={onRetry}
          style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
        >
          <Text style={styles.retryButtonText}>Tekrar dene</Text>
        </Pressable>
      </View>
    </View>
  )
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    retryKey: 0,
  }

  static getDerivedStateFromError(): Pick<AppErrorBoundaryState, 'hasError'> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.withScope((scope) => {
      scope.setContext('react', {
        componentStack: info.componentStack ?? 'Unavailable',
      })
      Sentry.captureException(error)
    })
  }

  private retry = () => {
    this.setState((state) => ({
      hasError: false,
      retryKey: state.retryKey + 1,
    }))
  }

  render() {
    if (this.state.hasError) return <ErrorFallback onRetry={this.retry} />

    return <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  afiMark: {
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: 20,
    width: 56,
  },
  afiMarkText: {
    color: '#047857',
    fontSize: 20,
    fontWeight: '800',
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 30,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 320,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#059669',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 52,
    paddingHorizontal: 20,
  },
  retryButtonPressed: {
    opacity: 0.82,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
})
