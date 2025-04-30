import winkNLP from 'wink-nlp'
import model from 'wink-eng-lite-web-model'

const nlp = winkNLP(model)
const its = nlp.its

// Very small list of words we never want as a "library keyword”.
const stopTerms = new Set([
  'how', 'what', 'when', 'where', 'upgrade', 'update', 'new', 'latest',
  'can', 'i', 'to', 'in', 'for', 'with', 'the', 'a', 'an',
])

/**
 * Pull the most likely tech/library word from free-form user input.
 * Returns `undefined` if nothing useful is found.
 */
export function extractKeyword(text: string): string | undefined {
  const doc = nlp.readDoc(text)

  const candidates: string[] = []
  doc.tokens().each((t) => {
    const pos = t.out(its.pos) // e.g. "NOUN", "PROPN"
    const value = t.out(its.normal)
    if ((pos === 'NOUN' || pos === 'PROPN') && !stopTerms.has(value)) {
      candidates.push(value)
    }
  })

  return candidates[0]
}