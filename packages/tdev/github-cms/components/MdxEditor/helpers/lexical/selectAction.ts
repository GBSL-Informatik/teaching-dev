import type { LexicalNode } from 'lexical';

export const GO_UP_KEYS = new Set(['ArrowUp', 'Backspace', 'ArrowLeft']);
export const GO_DOWN_KEYS = new Set(['ArrowRight', 'ArrowDown']);
export const HandledKeys = new Set([...GO_DOWN_KEYS, ...GO_UP_KEYS]);

export const SKIP = { action: 'skip' } as const;
export type Action =
    | typeof SKIP
    | { action: 'insertSpaceAfter'; node: LexicalNode }
    | { action: 'insertSpaceBefore'; node: LexicalNode }
    | { action: 'selectOrCreateNextParagraph' }
    | { action: 'selectOrCreatePreviousParagraph' };
