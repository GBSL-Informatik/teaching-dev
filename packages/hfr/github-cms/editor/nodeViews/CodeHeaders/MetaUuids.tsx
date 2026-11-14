import { observer } from 'mobx-react-lite';
import UuidBadge from '../../components/UuidBadge';
import { newUuid } from '../../uuid';
import type { NodeViewProps } from '../ReactNodeView';
import { metaUuids } from './metaUuids';

/**
 * The uuids in the meta string of a code block, e.g. ```` ```py live_py id=<uuid> ````,
 * each with a button to replace it with a new uuid, or to insert one into an `id` without a uuid.
 */
const MetaUuids = observer(({ handle }: NodeViewProps) => {
    const meta: string = handle.node.attrs.meta;
    return (
        <>
            {metaUuids(meta).map(({ name, uuid, replace }) => (
                <UuidBadge
                    key={uuid ?? name}
                    name={name}
                    uuid={uuid}
                    onRegenerate={() => handle.updateAttrs({ meta: replace(meta, newUuid()) })}
                />
            ))}
        </>
    );
});

export default MetaUuids;
