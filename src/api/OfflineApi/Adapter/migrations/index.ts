import { orderBy } from 'es-toolkit/array';
import initializeStores from './004-initialize-stores';
import linkQuizAnswers from './005-link-quiz-answers';
import constrainSingletonRoots from './006-constrain-singleton-roots';
import constrainQuizAnswers from './007-constrain-quiz-answers';
import type { Migration } from './types';

// Versions 1–3 predate the migration registry. Keep released migrations immutable.
export const migrations: readonly Migration[] = orderBy(
    [initializeStores, linkQuizAnswers, constrainSingletonRoots, constrainQuizAnswers],
    ['version'],
    ['asc']
);
export const DB_VERSION = migrations[migrations.length - 1].version;
