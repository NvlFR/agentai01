export function createMagicDocsService() {
  return {
    buildSection(input: {
      readonly title: string
      readonly bullets: readonly string[]
    }): string {
      return [`## ${input.title}`, ...input.bullets.map(bullet => `- ${bullet}`)].join('\n')
    },
  }
}
