// Validates the question bank against the schema in src/bank.js.
// Usage: node scripts/validate-bank.mjs data/questions.json
import { readFileSync } from 'node:fs';
import { validateBank } from '../src/bank.js';

const path = process.argv[2] || 'data/questions.json';
let bank;
try {
  bank = JSON.parse(readFileSync(path, 'utf8'));
} catch (err) {
  console.error(`Could not read ${path}: ${err.message}`);
  process.exit(1);
}
const errors = validateBank(bank);
if (errors.length) {
  console.error(`${errors.length} problem(s) in ${path}:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`${path}: ${bank.questions.length} questions, all valid.`);
