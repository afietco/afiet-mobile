export interface MobileEnvironmentInput {
  apiUrl?: string
  stackProjectId?: string
}

export interface MobileEnvironment {
  apiUrl: string
  stackProjectId: string
}

export function requireMobileEnvironment(input: MobileEnvironmentInput): MobileEnvironment {
  const apiUrl = input.apiUrl?.trim()
  const stackProjectId = input.stackProjectId?.trim()
  const missing: string[] = []

  if (!apiUrl) missing.push('EXPO_PUBLIC_API_URL')
  if (!stackProjectId) missing.push('EXPO_PUBLIC_STACK_PROJECT_ID')

  if (!apiUrl || !stackProjectId) {
    throw new Error(
      `Missing required mobile environment variables: ${missing.join(', ')}. ` +
        'Configure the EAS build profile or a local .env file.',
    )
  }

  return { apiUrl, stackProjectId }
}
