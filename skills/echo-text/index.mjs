export async function execute(input) {
  const original = input.text.trim()
  const text = input.uppercase ? original.toUpperCase() : original

  return {
    text,
    original,
    characterCount: original.length,
  }
}
