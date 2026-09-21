# Question Forge

Compare Jev question formulations on labeled development examples, lock a winner, then evaluate it on held-out data.

[![Tests](https://github.com/gbesse/question-forge/actions/workflows/test.yml/badge.svg)](https://github.com/gbesse/question-forge/actions/workflows/test.yml)

**Alpha · MIT · Node.js 22+ · no build required.** Includes finite candidate comparison, optional proposer rounds, an evaluation-call budget and an exported DecisionPack. It does not include an automatic generative model, hosted dataset service or statistical significance test.

## Try it

```sh
git clone https://github.com/gbesse/question-forge.git
cd question-forge
npm ci --ignore-scripts
npm run demo
node bin/question-forge.mjs examples/experiment.json /tmp/question-experiment.json --predictor examples/demo-predictor.mjs
```

The demo uses a tiny keyword fixture to illustrate the workflow. Its accuracy number is synthetic and is **not a Jev benchmark**. Install as a dependency with `npm install github:gbesse/question-forge#v0.1.0`.

Set `TYPESAFE_API_KEY` and use `--jev` instead of the fixture predictor to evaluate the actual formulations with pinned `jev-1.13.0`.

## Experiment contract

[The example specification](examples/experiment.json) contains:

- Candidates with unique ids, instructions and identical choice-label sets.
- Development and heldout rows with unique ids, nonempty text and a gold label.
- A pinned model and an explicit maximum number of prediction calls.
- Optional proposer rounds, from zero to five.

All candidates are scored on development accuracy. Input order breaks ties. The winner is selected before any heldout evaluation, then only that winner is evaluated on heldout. Predictor plugins receive `{ id, text }` without the gold label or split identity. Proposer plugins receive development examples and prior development reports only.

Duplicate ids and exactly identical texts across splits are rejected. Near-duplicate detection, temporal splits and correlated samples remain the dataset author's responsibility. Repeatedly tuning against the returned holdout score leaks information; rotate or seal your test set for serious evaluation.

## API and plugins

```js
import { experiment } from '@gbesse/question-forge';
import { createJevPredictor } from '@gbesse/question-forge/jev';
const report = await experiment(spec, { predictor: createJevPredictor() });
console.log(report.selectedCandidate.id, report.heldout.accuracy);
// report.pack is the selected versioned DecisionPack.
```

[Predictor and proposer contracts](docs/plugins.md) support other models or external search algorithms. A proposer can improve formulations from development mistakes; there is no built-in text-generation provider. Up to 32 candidates per batch, 128 total and 100,000 prediction calls are allowed. Before each batch, the engine reserves enough calls for the final heldout evaluation; insufficient budget fails the whole experiment. The budget counts predictions, not tokens, dollars or proposer calls.

Results retain candidate formulations, example-level predictions, scores, input fingerprints and the selected pack. Gold text is not included in the report, but ids, gold labels and candidate descriptions may still be sensitive. Individual HTTP inference records are not persisted by this runner; instrument a predictor when you need a full model audit trail.

## Validation

`npm run typecheck`, `npm run check`, `npm test` and `npm run demo` require no build. Tests assert holdout isolation, budget preflight, stable selection, immutable inputs, proposer boundaries, CLI artifacts and loopback HTTP behavior. Live model quality has not been evaluated. Plugins are trusted code, not sandboxed; each asynchronous hook has a deadline. See [SECURITY.md](SECURITY.md).

## Where this can grow

Licensed evaluation sets and comparable question formulations are the useful shared asset. Publish real baselines, model versions and sample sizes; an ecosystem of reproducible experiments matters more than an unsupported “best prompt” claim.
