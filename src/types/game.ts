/**
 * Game related type definitions and conversion functions
 */
import type {
  AcceptanceStatus,
  GameStatus,
  LineType,
  ProcessingStatus,
  Role,
} from "./common";
import type { TimestampInterface } from "./firestore";
import { dateToTimestamp, timestampToDate } from "./firestore";
import type {
  Cell,
  CellState,
  CompletedLine,
  Event,
  Game,
  GameBoard,
  GameParticipation,
  PlayerBoard,
  Submission,
} from "./schema";

/**
 * Game document as stored in Firestore
 */
export interface GameDocument {
  id: string;
  title: string;
  theme: string;
  creatorId: string;
  createdAt: TimestampInterface;
  updatedAt?: TimestampInterface | null;
  expiresAt: TimestampInterface;
  isPublic: boolean;
  isPhotoSharingEnabled: boolean;
  skipImageCheck: boolean;
  requiredBingoLines: number;
  confidenceThreshold: number;
  maxSubmissionsPerUser: number;
  notes?: string;
  status: GameStatus;
}

/**
 * Game board document as stored in Firestore
 */
export interface GameBoardDocument {
  cells: CellDocument[];
}

/**
 * Cell document as stored in Firestore
 */
export interface CellDocument {
  id: string;
  position: {
    x: number; // 0-4
    y: number; // 0-4
  };
  subject: string;
  isFree: boolean;
}

/**
 * Player board document as stored in Firestore
 */
export interface PlayerBoardDocument {
  userId: string;
  cellStates: Record<string, CellStateDocument>; // Map of cell ID to cell state
  completedLines: CompletedLineDocument[];
}

/**
 * Cell state document as stored in Firestore
 */
export interface CellStateDocument {
  isOpen: boolean;
  openedAt: TimestampInterface | null;
  openedBySubmissionId: string | null;
}

/**
 * Completed line document as stored in Firestore
 */
export interface CompletedLineDocument {
  type: LineType;
  index: number; // 0-4
  completedAt: TimestampInterface;
}

/**
 * Game participation document as stored in Firestore
 */
export interface GameParticipationDocument {
  userId: string;
  gameId: string;
  role: Role;
  joinedAt: TimestampInterface;
  createdAt: TimestampInterface;
  updatedAt?: TimestampInterface | null;
  completedLines?: number; // Number of completed lines (optional for backward compatibility)
  lastCompletedAt?: TimestampInterface | null;
  submissionCount?: number; // Number of submissions, max 30 (optional for backward compatibility)
}

/**
 * Submission document as stored in Firestore
 */
export interface SubmissionDocument {
  id: string; // ULID
  userId: string;
  imageUrl: string;
  submittedAt: TimestampInterface;
  analyzedAt: TimestampInterface | null;
  critique_ja: string;
  critique_en: string;
  matchedCellId: string | null;
  confidence: number | null;
  processingStatus: ProcessingStatus;
  acceptanceStatus: AcceptanceStatus | null;
  errorMessage: string | null;
  createdAt: TimestampInterface;
  updatedAt?: TimestampInterface | null;
  memo?: string; // Admin notes, not visible to users
}

/**
 * Event document as stored in Firestore
 */
export interface EventDocument {
  id: string; // ULID
  type: string;
  userId: string;
  timestamp: TimestampInterface;
  details?: Record<string, unknown>;
  createdAt: TimestampInterface;
  updatedAt?: TimestampInterface | null;
}

/**
 * Convert a Firestore game document to a game model
 */
export function gameFromFirestore(doc: GameDocument): Game {
  return {
    id: doc.id,
    title: doc.title,
    theme: doc.theme,
    creatorId: doc.creatorId,
    createdAt: timestampToDate(doc.createdAt) as Date,
    updatedAt: timestampToDate(doc.updatedAt),
    expiresAt: timestampToDate(doc.expiresAt) as Date,
    isPublic: doc.isPublic,
    isPhotoSharingEnabled: doc.isPhotoSharingEnabled,
    skipImageCheck: doc.skipImageCheck ?? false,
    requiredBingoLines: doc.requiredBingoLines,
    confidenceThreshold: doc.confidenceThreshold,
    maxSubmissionsPerUser: doc.maxSubmissionsPerUser,
    notes: doc.notes,
    status: doc.status,
  };
}

/**
 * Convert a game model to a Firestore document
 */
export function gameToFirestore(game: Game): GameDocument {
  return {
    id: game.id,
    title: game.title,
    theme: game.theme,
    creatorId: game.creatorId,
    createdAt: dateToTimestamp(game.createdAt) as TimestampInterface,
    updatedAt: game.updatedAt
      ? (dateToTimestamp(game.updatedAt) as TimestampInterface)
      : null,
    expiresAt: dateToTimestamp(game.expiresAt) as TimestampInterface,
    isPublic: game.isPublic,
    isPhotoSharingEnabled: game.isPhotoSharingEnabled,
    skipImageCheck: game.skipImageCheck,
    requiredBingoLines: game.requiredBingoLines,
    confidenceThreshold: game.confidenceThreshold,
    maxSubmissionsPerUser: game.maxSubmissionsPerUser,
    notes: game.notes,
    status: game.status,
  };
}

/**
 * Convert a Firestore game board document to a game board model
 */
export function gameBoardFromFirestore(doc: GameBoardDocument): GameBoard {
  return {
    cells: doc.cells.map(cellFromFirestore),
  };
}

/**
 * Convert a game board model to a Firestore document
 */
export function gameBoardToFirestore(board: GameBoard): GameBoardDocument {
  return {
    cells: board.cells.map(cellToFirestore),
  };
}

/**
 * Convert a Firestore cell document to a cell model
 */
export function cellFromFirestore(doc: CellDocument): Cell {
  return {
    id: doc.id,
    position: doc.position,
    subject: doc.subject,
    isFree: doc.isFree,
  };
}

/**
 * Convert a cell model to a Firestore document
 */
export function cellToFirestore(cell: Cell): CellDocument {
  return {
    id: cell.id,
    position: cell.position,
    subject: cell.subject,
    isFree: cell.isFree,
  };
}

/**
 * Convert a Firestore player board document to a player board model
 */
export function playerBoardFromFirestore(
  doc: PlayerBoardDocument,
): PlayerBoard {
  const cellStates: Record<string, CellState> = {};

  // Convert cell states
  for (const [cellId, state] of Object.entries(doc.cellStates)) {
    cellStates[cellId] = cellStateFromFirestore(state);
  }

  return {
    userId: doc.userId,
    cellStates,
    completedLines: doc.completedLines.map(completedLineFromFirestore),
  };
}

/**
 * Convert a player board model to a Firestore document
 */
export function playerBoardToFirestore(
  board: PlayerBoard,
): PlayerBoardDocument {
  const cellStates: Record<string, CellStateDocument> = {};

  // Convert cell states
  for (const [cellId, state] of Object.entries(board.cellStates)) {
    cellStates[cellId] = cellStateToFirestore(state);
  }

  return {
    userId: board.userId,
    cellStates,
    completedLines: board.completedLines.map(completedLineToFirestore),
  };
}

/**
 * Convert a Firestore cell state document to a cell state model
 */
export function cellStateFromFirestore(doc: CellStateDocument): CellState {
  return {
    isOpen: doc.isOpen,
    openedAt: timestampToDate(doc.openedAt),
    openedBySubmissionId: doc.openedBySubmissionId,
  };
}

/**
 * Convert a cell state model to a Firestore document
 */
export function cellStateToFirestore(state: CellState): CellStateDocument {
  return {
    isOpen: state.isOpen,
    openedAt: state.openedAt
      ? (dateToTimestamp(state.openedAt) as TimestampInterface)
      : null,
    openedBySubmissionId: state.openedBySubmissionId,
  };
}

/**
 * Convert a Firestore completed line document to a completed line model
 */
export function completedLineFromFirestore(
  doc: CompletedLineDocument,
): CompletedLine {
  return {
    type: doc.type,
    index: doc.index,
    completedAt: timestampToDate(doc.completedAt) as Date,
  };
}

/**
 * Convert a completed line model to a Firestore document
 */
export function completedLineToFirestore(
  line: CompletedLine,
): CompletedLineDocument {
  return {
    type: line.type,
    index: line.index,
    completedAt: dateToTimestamp(line.completedAt) as TimestampInterface,
  };
}

/**
 * Convert a Firestore game participation document to a game participation model
 */
export function gameParticipationFromFirestore(
  doc: GameParticipationDocument,
): GameParticipation {
  return {
    userId: doc.userId,
    gameId: doc.gameId,
    role: doc.role,
    joinedAt: timestampToDate(doc.joinedAt) as Date,
    createdAt: timestampToDate(doc.createdAt) as Date,
    updatedAt: timestampToDate(doc.updatedAt),
    completedLines: doc.completedLines ?? 0, // Default to 0 if not set
    lastCompletedAt: timestampToDate(doc.lastCompletedAt),
    submissionCount: doc.submissionCount ?? 0, // Default to 0 if not set
  };
}

/**
 * Convert a game participation model to a Firestore document
 */
export function gameParticipationToFirestore(
  participation: GameParticipation,
): GameParticipationDocument {
  return {
    userId: participation.userId,
    gameId: participation.gameId,
    role: participation.role,
    joinedAt: dateToTimestamp(participation.joinedAt) as TimestampInterface,
    createdAt: dateToTimestamp(participation.createdAt) as TimestampInterface,
    updatedAt: participation.updatedAt
      ? (dateToTimestamp(participation.updatedAt) as TimestampInterface)
      : null,
    completedLines: participation.completedLines,
    lastCompletedAt: participation.lastCompletedAt
      ? (dateToTimestamp(participation.lastCompletedAt) as TimestampInterface)
      : null,
    submissionCount: participation.submissionCount,
  };
}

/**
 * Convert a Firestore submission document to a submission model
 */
export function submissionFromFirestore(doc: SubmissionDocument): Submission {
  return {
    id: doc.id,
    userId: doc.userId,
    imageUrl: doc.imageUrl,
    submittedAt: timestampToDate(doc.submittedAt) as Date,
    analyzedAt: timestampToDate(doc.analyzedAt),
    critique_ja: doc.critique_ja,
    critique_en: doc.critique_en,
    matchedCellId: doc.matchedCellId,
    confidence: doc.confidence,
    processingStatus: doc.processingStatus,
    acceptanceStatus: doc.acceptanceStatus,
    errorMessage: doc.errorMessage,
    createdAt: timestampToDate(doc.createdAt) as Date,
    updatedAt: timestampToDate(doc.updatedAt),
    memo: doc.memo,
  };
}

/**
 * Convert a submission model to a Firestore document
 */
export function submissionToFirestore(
  submission: Submission,
): SubmissionDocument {
  const doc: SubmissionDocument = {
    id: submission.id,
    userId: submission.userId,
    imageUrl: submission.imageUrl,
    submittedAt: dateToTimestamp(submission.submittedAt) as TimestampInterface,
    analyzedAt: submission.analyzedAt
      ? (dateToTimestamp(submission.analyzedAt) as TimestampInterface)
      : null,
    critique_ja: submission.critique_ja,
    critique_en: submission.critique_en,
    matchedCellId: submission.matchedCellId,
    confidence: submission.confidence,
    processingStatus: submission.processingStatus,
    acceptanceStatus: submission.acceptanceStatus,
    errorMessage: submission.errorMessage,
    createdAt: dateToTimestamp(submission.createdAt) as TimestampInterface,
    updatedAt: submission.updatedAt
      ? (dateToTimestamp(submission.updatedAt) as TimestampInterface)
      : null,
  };

  // Only include memo if it's not undefined
  if (submission.memo !== undefined) {
    doc.memo = submission.memo;
  }

  return doc;
}

/**
 * Convert a Firestore event document to an event model
 */
export function eventFromFirestore(doc: EventDocument): Event {
  return {
    id: doc.id,
    type: doc.type,
    userId: doc.userId,
    timestamp: timestampToDate(doc.timestamp) as Date,
    details: doc.details,
    createdAt: timestampToDate(doc.createdAt) as Date,
    updatedAt: timestampToDate(doc.updatedAt),
  };
}

/**
 * Convert an event model to a Firestore document
 */
export function eventToFirestore(event: Event): EventDocument {
  return {
    id: event.id,
    type: event.type,
    userId: event.userId,
    timestamp: dateToTimestamp(event.timestamp) as TimestampInterface,
    details: event.details,
    createdAt: dateToTimestamp(event.createdAt) as TimestampInterface,
    updatedAt: event.updatedAt
      ? (dateToTimestamp(event.updatedAt) as TimestampInterface)
      : null,
  };
}
