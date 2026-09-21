// Purpose: Use an intentionally trivial keyword fixture; this is not a Jev benchmark.
export async function predict(candidate, row) {
  return { label: candidate.id === 'expanded' && /broken|crashes/.test(row.text) || /urgent/.test(row.text) ? 'urgent' : 'routine' };
}
