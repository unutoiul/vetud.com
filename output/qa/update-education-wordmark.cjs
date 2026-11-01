const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const files = ['vetud-logo.svg', 'vetud-logo-white.svg'].map(name => path.join('apps/storefront/public/brand', name))
const before = fs.readFileSync(files[0], 'utf8')
const subtitle = before.match(/<g id="PEPTIDE-SERIES">([^]*?)<\/g>/)?.[1]
assert(subtitle, 'Original outlined subtitle found')
const shapes = [...subtitle.matchAll(/<path d="([^"]+)"/g)].map(match => match[1])
const glyphs = {}
for (const [i, letter] of [...'PEPTIDESERIES'].entries()) glyphs[letter] = shapes[i]
Object.assign(glyphs, {
  U: 'M0 0H12V64C12 82 20 91 36 91C52 91 60 82 60 64V0H72V64C72 89 59 102 36 102C13 102 0 89 0 64Z',
  C: 'M70 7L65 18C58 13 50 10 40 10C21 10 12 24 12 50C12 76 21 90 40 90C50 90 58 87 65 82L70 93C61 99 51 102 39 102C14 102 0 83 0 50C0 17 14 -2 39 -2C51 -2 61 1 70 7Z',
  A: 'M30 0H44L74 100H61L53 72H21L13 100H0ZM24 61H50L37 15Z',
  O: 'M38 -2C62 -2 76 17 76 50C76 83 62 102 38 102C14 102 0 83 0 50C0 17 14 -2 38 -2ZM38 10C21 10 12 23 12 50C12 77 21 90 38 90C55 90 64 77 64 50C64 23 55 10 38 10Z',
  N: 'M0 0H13L60 78V0H72V100H59L12 22V100H0Z',
})
const widths = { P: 64, E: 57, T: 65, I: 12, D: 72, S: 62, U: 72, C: 70, A: 74, O: 76, N: 72 }
const label = 'PEPTIDES EDUCATION'
const letters = [...label].filter(letter => letter !== ' ')
const scale = .105, tracking = 4.5, wordSpace = 7.5
const width = letters.reduce((sum, letter) => sum + widths[letter] * scale, 0) + (letters.length - 1) * tracking + wordSpace
let x = (60.8 + 279.1 - width) / 2
const paths = [...label].map(letter => {
  if (letter === ' ') { x += wordSpace; return '' }
  const shape = `<path data-letter="${letter}" d="${glyphs[letter]}" transform="translate(${x.toFixed(5)} 170.3) scale(${scale})"/>`
  x += widths[letter] * scale + tracking
  return shape
}).join('')
const replacement = `<g id="PEPTIDES-EDUCATION" aria-label="Peptides Education">${paths}</g>`
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  const updated = source.replace(/<g id="PEPTIDE-SERIES">[^]*?<\/g>/, replacement).replace(/VETUD Peptide Series[^<]*/, 'VETUD Peptides Education')
  assert(updated.includes('id="PEPTIDES-EDUCATION"') && !updated.includes('PEPTIDE-SERIES'))
  fs.writeFileSync(file, updated)
}
console.log('Updated both vector wordmarks: PEPTIDES EDUCATION. VETUD lettering and symbol preserved.')
