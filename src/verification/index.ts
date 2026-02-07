export { VerificationEngine } from './VerificationEngine';
export { DiffAnalyzer } from './DiffAnalyzer';
export { SpecMatcher } from './SpecMatcher';
export { SeverityRater } from './SeverityRater';
export { FeedbackGenerator } from './FeedbackGenerator';

export type {
  DiffFormat,
  DiffMetadata,
  DiffInput,
  ParsedDiff,
  SpecMatchResult,
  RequirementMatch,
  Deviation,
  SeverityRating,
  MatchWithRatings,
  RatingContext,
  FeedbackContext,
  FixSuggestion,
  VerificationInput,
  VerificationOptions,
  DiffAdapter,
  FileChange,
  LineChange,
  DiffStatistics
} from './types';

export {
  GitDiffAdapter,
  GitHubAdapter,
  GitLabAdapter,
  createAdapter,
  detectFormatFromInput
} from './adapters';
