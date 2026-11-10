import { observer } from 'mobx-react-lite';
import UuidBadge from '../../components/UuidBadge';
import { isUuidV4, newUuid, uuidV4Regex } from '../../uuid';
import type { NodeViewProps } from '../ReactNodeView';

interface MetaUuid {
    name: string;
    /** not set for an `id` without a uuid */
    uuid?: string;
    /** the meta string with a new uuid */
    regenerate: (meta: string) => string;
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
        regenerate: (meta) => meta.replace(match[0], newUuid())
    }));
};

/** an `id` without a uuid yet, e.g. `id=` while typing, gets a button to insert one */
const idWithoutUuid = (meta: string): MetaUuid | undefined => {
    const match = ID_ATTRIBUTE.exec(meta);
    if (!match || isUuidV4(unquote(match[2] ?? ''))) {
        return undefined;
    }
    const quote = match[2]?.startsWith("'") ? "'" : match[2]?.startsWith('"') ? '"' : '';
    return {
        name: 'id',
        regenerate: (meta) => meta.replace(ID_ATTRIBUTE, `$1id=${quote}${newUuid()}${quote}`)
    };
};

/**
 * The uuids in the meta string of a code block, e.g. ```` ```py live_py id=<uuid> ````,
 * each with a button to replace it with a new uuid.
 */
const MetaUuids = observer(({ handle }: NodeViewProps) => {
    const meta: string = handle.node.attrs.meta;
    const missingId = idWithoutUuid(meta);
    const metaUuids = missingId ? [missingId, ...uuidsOfMeta(meta)] : uuidsOfMeta(meta);
    return (
        <>
            {metaUuids.map(({ name, uuid, regenerate }) => (
                <UuidBadge
                    key={uuid ?? name}
                    name={name}
                    uuid={uuid}
                    onRegenerate={() => handle.updateAttrs({ meta: regenerate(meta) })}
                />
            ))}
        </>
    );
});

export default MetaUuids;
