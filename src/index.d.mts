// Purpose: Type experiment splits and prevent gold labels in the predictor contract.
import type { Pack, DecisionRecord } from '@gbesse/decisionpacks';
export interface Candidate { id: string; instructions: string; criteria: Record<string, string> }
export interface Row { id: string; text: string; label: string }
export interface Spec { candidates: Candidate[]; development: Row[]; heldout: Row[]; model?: string; rounds?: number; maxEvaluations?: number }
export interface Metrics { accuracy: number; correct: number; total: number; predictions: { id: string; expected: string; predicted: string; correct: boolean }[] }
export interface CandidateReport { candidate: Candidate; round: number; development: Metrics }
export type Predictor = (candidate: Candidate, row: Pick<Row, 'id' | 'text'>, options: { model: string; signal: AbortSignal }) => Promise<{ label: string; record?: DecisionRecord }>;
export type Proposer = (context: { round: number; development: Row[]; reports: CandidateReport[]; labels: string[] }, options: { signal: AbortSignal }) => Promise<Candidate[]>;
export interface Report { schemaVersion: 1; model: string; selectedCandidate: Candidate; selection: 'development_accuracy_then_input_order'; development: CandidateReport[]; heldout: Metrics; calls: number; maxEvaluations: number; provenance: { developmentFingerprint: string; heldoutFingerprint: string; candidateFingerprint: string }; pack: Pack }
export function toPack(candidate: Candidate, model?: string): Pack;
export function experiment(spec: Spec, options: { predictor: Predictor; proposer?: Proposer; timeoutMs?: number; signal?: AbortSignal }): Promise<Report>;
