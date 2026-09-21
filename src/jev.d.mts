// Purpose: Type the optional Jev adapter and injectable provider.
import type { Provider } from '@gbesse/decisionpacks';
import type { Predictor } from './index.mjs';
export function createJevPredictor(options?: { provider?: Provider; signal?: AbortSignal }): Predictor;
