import { observer } from 'mobx-react-lite';
import UuidBadge from '../../components/UuidBadge';
import { newUuid, uuidV4Regex } from '../../uuid';
import type { NodeViewProps } from '../ReactNodeView';

/** e.g. `id` for `id="<uuid>"`, `uuid` when the uuid has no name */
const nameBefore = (text: string) => /([\w-]+)=["']?$/.exec(text)?.[1] ?? 'uuid';

const uuidsOfMeta = (meta: string) => {
    return [...meta.matchAll(uuidV4Regex())].map((match) => ({
        name: nameBefore(meta.slice(0, match.index)),
        uuid: match[0]
    }));
};

/**
 * The uuids in the meta string of a code block, e.g. ```` ```py live_py id=<uuid> ````,
 * each with a button to replace it with a new uuid.
 */
const MetaUuids = observer(({ handle }: NodeViewProps) => {
    const meta: string = handle.node.attrs.meta;
    return (
        <>
            {uuidsOfMeta(meta).map(({ name, uuid }) => (
                <UuidBadge
                    key={uuid}
                    name={name}
                    uuid={uuid}
                    onRegenerate={() => handle.updateAttrs({ meta: meta.replace(uuid, newUuid()) })}
                />
            ))}
        </>
    );
});

export default MetaUuids;
