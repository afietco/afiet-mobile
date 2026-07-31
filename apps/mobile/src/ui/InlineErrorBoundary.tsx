import * as Sentry from '@sentry/react-native'
import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'

/**
 * A boundary that fits inside a sheet.
 *
 * Without one, a throw while rendering the contents of a popup unmounts the
 * subtree and leaves the popup open and empty: the chrome still draws, the
 * close button still works, and where the flow should be there is nothing to
 * read and nothing to tap. A release build has no red box, so the failure is
 * silent for the person and for us. Tab screens were given the same treatment
 * for the same reason (ui/ScreenErrorBoundary); popups draw in the overlay
 * layer, outside the route, so the route's boundary never sees them.
 *
 * `AppErrorBoundary` is the wrong tool here: its fallback owns the window and
 * offers to sign out, which is far too big an answer to one step of one sheet
 * going wrong.
 */

interface InlineErrorBoundaryProps {
  children: ReactNode
  /** Named in the retry label so the panel says what it is retrying. */
  label?: string
}

interface InlineErrorBoundaryState {
  hasError: boolean
  retryKey: number
}

export class InlineErrorBoundary extends Component<
  InlineErrorBoundaryProps,
  InlineErrorBoundaryState
> {
  state: InlineErrorBoundaryState = { hasError: false, retryKey: 0 }

  static getDerivedStateFromError(): Pick<InlineErrorBoundaryState, 'hasError'> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.withScope((scope) => {
      scope.setContext('react', { componentStack: info.componentStack ?? 'Unavailable' })
      Sentry.captureException(error)
    })
  }

  private retry = () => {
    this.setState((state) => ({ hasError: false, retryKey: state.retryKey + 1 }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="items-center rounded-2xl bg-muted px-5 py-6">
          <AfiPose pose="oops" size={72} accessibilityLabel="Afi bu adımı açamadı" />
          <AppText weight="bold" className="mt-2 text-center text-ink">
            Bu adımı açamadım
          </AppText>
          <AppText className="mt-1 text-center text-sm leading-5 text-soft">
            Bir şey ters gitti, ama kayıtların yerinde duruyor.
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={this.props.label ?? 'Tekrar dene'}
            onPress={this.retry}
            className="mt-4 rounded-2xl bg-emerald-600 px-6 py-3 active:opacity-90"
          >
            <AppText weight="bold" className="text-white">
              Tekrar dene
            </AppText>
          </Pressable>
        </View>
      )
    }

    return <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>
  }
}
