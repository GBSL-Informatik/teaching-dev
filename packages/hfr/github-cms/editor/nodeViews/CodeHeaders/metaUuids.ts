import { isUuidV4, uuidV4Regex } from '../../uuid';

export interface MetaUuid {
    name: string;
    /** not set for an `id` without a uuid */
    uuid?: string;
    /** the meta string with `uuid` in place of this one */
    replace: (meta: string, uuid: string) => string;
}

/** `id`, `id=` or `id=value`, also quoted: `id="value"` */
const ID_ATTRIBUTE = /(^|\s)id(?:=("[^"]*"|'[^']*'|[^\s"']*))?(?=\s|$)/;

/** e.g. `id` for `id="<uuid>"`, `uuid` when the uuid has no name */
const nameBefore = (text: string) => /([\w-]+)=["']?$/.exec(text)?.[1] ?? 'uuid';

const unquote = (value: string) => value.replace(/^["']|["']$/g, '');

const uuidsOfMeta = (meta: string): MetaUuid[] => {
    return [...meta.matchAll(uuidV4Regex())].map((match) => ({
        name: nameBefore(meta.slice(0, match.index)),
        uuid: match[0],
        replace: (meta, uuid) => meta.replace(match[0], uuid)
    }));
};

/** an `id` without a uuid yet, e.g. `id=` while typing, so a uuid can be inserted */
const idWithoutUuid = (meta: string): MetaUuid | undefined => {
    const match = ID_ATTRIBUTE.exec(meta);
    if (!match || isUuidV4(unquote(match[2] ?? ''))) {
        return undefined;
    }
    const quote = match[2]?.startsWith("'") ? "'" : match[2]?.startsWith('"') ? '"' : '';
    return {
        name: 'id',
        replace: (meta, uuid) => meta.replace(ID_ATTRIBUTE, `$1id=${quote}${uuid}${quote}`)
    };
};

/**
 * The uuids in the meta string of a code block, e.g. ```` ```py live_py id=<uuid> ````,
 * preceded by an `id` without a uuid.
 */
export const metaUuids = (meta: string): MetaUuid[] => {
    const missingId = idWithoutUuid(meta);
    return missingId ? [missingId, ...uuidsOfMeta(meta)] : uuidsOfMeta(meta);
};
