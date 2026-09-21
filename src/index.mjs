// Purpose: Compare question formulations on development data and evaluate a locked winner on held-out examples.
import { fingerprint, validatePack } from '@gbesse/decisionpacks';
import { ensure, nonempty, snapshot, bounded } from './contracts.mjs';
export function toPack(candidate, model = 'jev-1.13.0') {
  const pack = { schemaVersion: 1, name: 'question-forge/classifier', version: '0.1.0', description: 'Selected question formulation; validate on your own data before deployment.', model, inputs: { text: 'string' }, questions: { category: { type: 'choice', instructions: candidate.instructions, criteria: snapshot(candidate.criteria) } }, rules: [], fallback: 'review' };
  validatePack(pack); return pack;
}
export async function experiment(spec, { predictor, proposer, timeoutMs = 30000, signal } = {}) {
  spec = snapshot(spec);
  const { development, heldout, model = 'jev-1.13.0', maxEvaluations = 1000, rounds = 0 } = spec;
  ensure(typeof predictor === 'function' && Array.isArray(spec.candidates) && spec.candidates.length > 0 && spec.candidates.length <= 32, 'Provide a predictor and 1–32 candidates');
  ensure(Number.isSafeInteger(rounds) && rounds >= 0 && rounds <= 5 && (!rounds || typeof proposer === 'function'), 'Rounds require a proposer (maximum 5)');
  ensure(Number.isSafeInteger(maxEvaluations) && maxEvaluations > 0 && maxEvaluations <= 100000, 'Invalid evaluation budget');
  const ids = new Set(), texts = new Set(), candidateIds = new Set();
  ensure(Array.isArray(development) && development.length && Array.isArray(heldout) && heldout.length, 'Both development and heldout data are required');
  const labels = Object.keys(spec.candidates[0].criteria ?? {}).sort();
  for (const row of [...development, ...heldout]) {
    ensure(nonempty(row.id) && !ids.has(row.id) && nonempty(row.text) && !texts.has(row.text) && labels.includes(row.label), 'Dataset ids/texts must be unique across splits, with known labels'); ids.add(row.id); texts.add(row.text);
  }
  const validateCandidates = candidates => {
    ensure(Array.isArray(candidates) && candidates.length > 0 && candidates.length <= 32 && candidateIds.size + candidates.length <= 128, 'Invalid candidate batch');
    for (const c of candidates) {
      ensure(nonempty(c.id) && !candidateIds.has(c.id) && JSON.stringify(Object.keys(c.criteria ?? {}).sort()) === JSON.stringify(labels), 'Candidates require unique ids and identical label sets');
      toPack(c, model); candidateIds.add(c.id);
    }
  };
  let calls = 0; const reports = []; let batches = spec.candidates;
  async function evaluate(candidate, rows) {
    let correct = 0; const predictions = [];
    for (const row of rows) {
      signal?.throwIfAborted(); calls++;
      // Gold labels and split identity never enter the predictor contract.
      const prediction = snapshot(await bounded(s => predictor(snapshot(candidate), { id: row.id, text: row.text }, { model, signal: s }), { timeoutMs, signal }));
      ensure(labels.includes(prediction.label), 'Predictor returned an unknown label');
      const matches = prediction.label === row.label; if (matches) correct++;
      predictions.push({ id: row.id, expected: row.label, predicted: prediction.label, correct: matches });
    }
    return { accuracy: correct / rows.length, correct, total: rows.length, predictions };
  }
  for (let round = 0; round <= rounds; round++) {
    validateCandidates(batches);
    // Reserve the final evaluation before starting a batch, so no partial batch can bias selection.
    ensure(calls + batches.length * development.length + heldout.length <= maxEvaluations, 'Evaluation budget insufficient for batch plus heldout');
    for (const candidate of batches) reports.push({ candidate: snapshot(candidate), round, development: await evaluate(candidate, development) });
    if (round < rounds) batches = snapshot(await bounded(s => proposer({ round, development: snapshot(development), reports: snapshot(reports), labels: [...labels] }, { signal: s }), { timeoutMs, signal }));
  }
  const winner = reports.reduce((best, row) => row.development.accuracy > best.development.accuracy ? row : best);
  // Lock selection before consulting heldout labels; stable input order breaks development ties.
  const heldoutReport = await evaluate(winner.candidate, heldout);
  return { schemaVersion: 1, model, selectedCandidate: snapshot(winner.candidate), selection: 'development_accuracy_then_input_order', development: reports, heldout: heldoutReport, calls, maxEvaluations, provenance: { developmentFingerprint: fingerprint(development), heldoutFingerprint: fingerprint(heldout), candidateFingerprint: fingerprint(winner.candidate) }, pack: toPack(winner.candidate, model) };
}
