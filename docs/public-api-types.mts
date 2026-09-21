// Purpose: Compile representative public API usage without producing build output.
import { experiment, toPack, type Spec } from '../src/index.mjs';
import { createJevPredictor } from '../src/jev.mjs';
const spec: Spec = { candidates: [{ id: 'first', instructions: 'Classify', criteria: { yes: 'Yes', no: 'No' } }], development: [{ id: 'd', text: 'yes', label: 'yes' }], heldout: [{ id: 'h', text: 'no', label: 'no' }] };
const result = await experiment(spec, { predictor: createJevPredictor() });
toPack(result.selectedCandidate);
