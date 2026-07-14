import api from './api'

export interface OnboardingState {
  coachSeen: string[]
  checklistDismissed: boolean
  celebrationShown: boolean
  reportsVisited: boolean
  tourVersion: number
}

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  coachSeen: [],
  checklistDismissed: false,
  celebrationShown: false,
  reportsVisited: false,
  tourVersion: 0,
}

export const onboardingApi = {
  update: (patch: Partial<OnboardingState>) =>
    api.patch<OnboardingState>('/users/me/onboarding', patch),
}
