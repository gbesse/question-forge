// Purpose: Predict a candidate label with pinned Jev while withholding the dataset's gold label.
import { evaluate, createJevProvider } from '@gbesse/decisionpacks';
import { toPack } from './index.mjs';
export function createJevPredictor({ provider } = {}) {
  return async (candidate, row, { model = 'jev-1.13.0', signal } = {}) => {
    const record = await evaluate(toPack(candidate, model), { text: row.text }, { provider: provider ?? createJevProvider(), signal });
    return { label: record.answers.category.choice, record };
  };
}
