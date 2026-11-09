import { observer } from 'mobx-react-lite';
import AttributesEditor from '../../components/AttributesEditor';
import {
    directiveAttributesToRows,
    rowsToDirectiveAttributes
} from '../../components/AttributesEditor/conversions';
import NodeToolbar from '../../components/NodeToolbar';
import { directiveAttributes } from '../../markdown/serialize';
import type { NodeViewProps } from '../ReactNodeView';

/**
 * An item of `:::cards` or `:::flex`, the toolbar shows the `::br` it starts with.
 * The first item can omit the `::br`, then the title is empty.
 */
const DirectiveItem = observer(({ handle }: NodeViewProps) => {
    const { attributes, explicitBreak } = handle.node.attrs;
    return (
        <NodeToolbar handle={handle} title={explicitBreak ? `::br${directiveAttributes(attributes)}` : ''}>
            <AttributesEditor
                title="Attribute von ::br"
                rows={directiveAttributesToRows(attributes)}
                // attributes are written to the `::br`, so it can not be omitted anymore
                onApply={(rows) =>
                    handle.updateAttrs({ attributes: rowsToDirectiveAttributes(rows), explicitBreak: true })
                }
            />
        </NodeToolbar>
    );
});

export default DirectiveItem;
