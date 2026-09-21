// Purpose: Run a synthetic formulation comparison without calling an external model.
import { readFile } from 'node:fs/promises';
import { experiment } from '../src/index.mjs';
import { predict } from './demo-predictor.mjs';
const spec = JSON.parse(await readFile(new URL('./experiment.json', import.meta.url), 'utf8'));
const result = await experiment(spec, { predictor: predict });
console.log(JSON.stringify({ syntheticFixture: true, selected: result.selectedCandidate.id, calls: result.calls, heldoutAccuracy: result.heldout.accuracy }, null, 2));
