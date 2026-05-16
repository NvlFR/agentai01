import { err, ok, type Result } from '../shared/index.js'

export type WizardStep = {
  id: string
  prompt: string
  required?: boolean
  validate?: (value: string) => Result<string, string>
}

export type WizardSession = {
  currentStepId: string | null
  answers: Record<string, string>
  completed: boolean
}

export type Wizard = {
  start(): WizardSession
  answer(session: WizardSession, value: string): Result<WizardSession, string>
  current(session: WizardSession): WizardStep | null
}

export function createWizard(steps: readonly WizardStep[]): Wizard {
  return {
    start() {
      return {
        currentStepId: steps[0]?.id ?? null,
        answers: {},
        completed: steps.length === 0,
      }
    },
    answer(session, value) {
      const step = steps.find(candidate => candidate.id === session.currentStepId)
      if (!step) {
        return err('Wizard session is already complete.')
      }

      const trimmed = value.trim()
      if (step.required && !trimmed) {
        return err('This step requires a value.')
      }

      const validated = step.validate ? step.validate(trimmed) : ok(trimmed)
      if (!validated.ok) {
        return validated
      }

      const currentIndex = steps.findIndex(candidate => candidate.id === step.id)
      const nextStep = steps[currentIndex + 1]
      return ok({
        currentStepId: nextStep?.id ?? null,
        answers: { ...session.answers, [step.id]: validated.value },
        completed: !nextStep,
      })
    },
    current(session) {
      return steps.find(step => step.id === session.currentStepId) ?? null
    },
  }
}
