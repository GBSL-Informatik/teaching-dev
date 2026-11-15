import { mdiRefresh } from '@mdi/js';
import { v4 as uuidv4 } from 'uuid';

const UUID_V4_SOURCE = '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

/** matches uuids (v4), e.g. used as `id` of persisted components or as `page_id` */
export const uuidV4Regex = () => new RegExp(UUID_V4_SOURCE, 'gi');

export const isUuidV4 = (value: string | null | undefined): value is string => {
    return !!value && new RegExp(`^${UUID_V4_SOURCE}$`, 'i').test(value);
};

export const findUuids = (text: string): { from: number; to: number }[] => {
    return [...text.matchAll(uuidV4Regex())].map((match) => ({
        from: match.index,
        to: match.index + match[0].length
    }));
};

export interface DuplicatedUuid {
    uuid: string;
    count: number;
}

/**
 * The uuids occurring more than once in the text, e.g. the `id` of a copied component.
 * Uuids are compared ignoring their case.
 */
export const duplicatedUuids = (text: string): DuplicatedUuid[] => {
    const counts = new Map<string, number>();
    for (const [match] of text.matchAll(uuidV4Regex())) {
        const uuid = match.toLowerCase();
        counts.set(uuid, (counts.get(uuid) ?? 0) + 1);
    }
    return [...counts].filter(([, count]) => count > 1).map(([uuid, count]) => ({ uuid, count }));
};

export const newUuid = (): string => uuidv4();

/**
 * The button rendered next to a uuid to replace it with a new one.
 */
export const createRegenerateButton = (onRegenerate: () => void) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cms-uuid-regenerate';
    button.title = 'Neue UUID generieren';
    button.contentEditable = 'false';
    button.innerHTML = `<svg viewBox="0 0 24 24"><path d="${mdiRefresh}" /></svg>`;
    // keep the focus (and selection) where it is
    button.addEventListener('mousedown', (event) => event.preventDefault());
    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        onRegenerate();
    });
    return button;
};
