# Plugin contracts

This document defines the version 0.1 extension interfaces and their trust boundaries.

## Predictor

CLI: `--predictor ./my-predictor.mjs`. Export async `predict(candidate, { id, text }, { model, signal })` returning `{ label }` from the candidate's fixed label set. The host deliberately withholds the gold label and split identity. Optional provider records are not persisted in the experiment report.

## Proposer

CLI: `--proposer ./my-proposer.mjs`, plus positive `rounds` in the specification. Export async `propose({ round, development, reports, labels }, { signal })` and return 1–32 new candidates. Each candidate needs a fresh id, instructions and the same choice labels. The context contains development labels and errors, never heldout rows or scores. Total candidates across rounds are capped at 128.

A proposal can come from a generative model, manual catalog or search algorithm. No generative model is included. External proposer calls need their own network deadline, obey the provided signal, and should report their own cost; they are not counted in the prediction-call budget.

## Shared rules

Modules loaded by path are trusted executable code, not data or sandboxed extensions. All portable values must be finite acyclic JSON. Async hooks default to a 30-second deadline and receive an AbortSignal. Deadlines stop waiting; synchronous loops or effects that ignore cancellation cannot be forcibly stopped in-process. External requests need explicit network timeouts. Errors propagate to the caller; the embedding application owns administrator alerting and must not silently fabricate a successful result.

Provider injection uses `createJevProvider` from the pinned DecisionPacks dependency. Use loopback HTTP fixtures for integration tests. Do not commit provider keys, production records or personal data in contributed examples.
