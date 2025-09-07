import React from 'react';

export const DUMMY_PREFIX = 'dummy-' as const;
export const TEMP_PREFIX = `${DUMMY_PREFIX}temp-` as const;

/**
 * Checks if a given id is a dummy id.
 * @param id of a document
 * @returns whether an id starts with 'dummy-' prefix
 */
export const isDummyId = (id: string) => {
    return id.startsWith(DUMMY_PREFIX);
};

/**
 * Checks if a given id is a temporary id and could potentially
 *          be loaded/persisted from the backend
 * @param id of a document
 * @returns whether an id starts with 'dummy-temp-' prefix
 */
export const isTempId = (id: string) => {
    return id.startsWith(TEMP_PREFIX);
};

/**
 * @param refId optional id that references a parent (e.g. the root document)
 *              when a refId is provided, it is checked wheter it is a dummyId:
 *              -> refId is a dummyId: prefix with 'dummy-'
 *              -> refId isn't a dummyId: prefix with 'dummy-temp-'
 * @returns a unique dummy ID
 * @example
 * ```tsx
 * useDummyId() # => 'dummy-:r1:`
 * useDummyId('dummy-:r2:') # => 'dummy-:r3:`
 * useDummyId('2c8f24f4-...') # => 'dummy-temp-:r3:`
 * ```
 */
export const useDummyId = (refId?: string) => {
    const id = React.useId();
    if (!refId || isDummyId(refId)) {
        return `${DUMMY_PREFIX}${id}`;
    }
    return `${TEMP_PREFIX}${id}`;
};
