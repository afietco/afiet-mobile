import { useLocalSearchParams } from 'expo-router'
import { ChatScreen } from '@/features/chat/ChatScreen'
import { isAssistantId } from '@/features/chat/types'

/** Route: /sohbet?asistan=afi|beslenme|destek (defaults to afi). */
export default function SohbetScreen() {
  const { asistan } = useLocalSearchParams<{ asistan?: string }>()
  const assistant = isAssistantId(asistan) ? asistan : 'afi'
  // Remount on assistant change: each conversation is its own screen state.
  return <ChatScreen key={assistant} assistant={assistant} />
}

export { ScreenErrorBoundary as ErrorBoundary } from '@/ui/ScreenErrorBoundary'
