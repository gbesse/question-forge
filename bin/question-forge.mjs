#!/usr/bin/env node
// Purpose: Compare question candidates and save a reproducible report plus the selected decision pack.
import { experiment } from '../src/index.mjs';
import { readJSON, writeJSON, loadPlugin, assertNewOutput } from '../src/cli-files.mjs';
async function main() {
  const [specFile, output, ...flags] = process.argv.slice(2);
  if (!specFile || specFile === '--help') { console.log('question-forge SPEC.json OUTPUT.json [--jev | --predictor PLUGIN.mjs] [--proposer PLUGIN.mjs]\nPredictors export predict; optional proposers export propose. Outputs include the selected decision pack.'); return; }
  if (!output) throw new Error('Expected SPEC OUTPUT');
  await assertNewOutput(output);
  let predictor, proposer;
  for (let i = 0; i < flags.length; i++) {
    if (flags[i] === '--jev' && !predictor) predictor = (await import('../src/jev.mjs')).createJevPredictor();
    else if (flags[i] === '--predictor' && flags[i + 1] && !predictor) { predictor = (await loadPlugin(flags[++i])).predict; if (typeof predictor !== 'function') throw new Error('Plugin must export predict'); }
    else if (flags[i] === '--proposer' && flags[i + 1] && !proposer) { proposer = (await loadPlugin(flags[++i])).propose; if (typeof proposer !== 'function') throw new Error('Plugin must export propose'); }
    else throw new Error('Invalid flag');
  }
  const result = await experiment(await readJSON(specFile), { predictor, proposer });
  await writeJSON(output, result); console.log(JSON.stringify({ selected: result.selectedCandidate.id, heldout: result.heldout.accuracy, calls: result.calls }));
}
main().catch(error => { console.error(`question-forge: ${error.message}`); process.exitCode = 1; });
