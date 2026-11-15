import TextInput from '@tdev-components/shared/TextInput';
import { isMediaDirective } from '@tdev-plugins/remark-media/mediaElement';
import { observer } from 'mobx-react-lite';
import AttributesEditor from '../../components/AttributesEditor';
import {
    directiveAttributesToRows,
    rowsToDirectiveAttributes
} from '../../components/AttributesEditor/conversions';
import EditableTag from '../../components/EditableTag';
import NodeToolbar from '../../components/NodeToolbar';
import UuidAttributes from '../../components/UuidAttributes';
import { directiveHeadOf, parseDirectiveHead } from '../../markdown/directiveHead';
import { directiveAttributes } from '../../markdown/serialize';
import type { NodeViewProps } from '../ReactNodeView';
import MediaPreview from './MediaPreview';
import MediaSource from './MediaSource';
import { hasSourceLabel } from './sourceDirectives';

/**
 * `::name[label]{attributes}`. Media directives like `::youtube[url]` are shown with a preview,
 * `::pdf[path]` only with the source field of the media directives.
 */
const LeafDirective = observer(({ handle }: NodeViewProps) => {
    const { name, label, attributes } = handle.node.attrs;
    const isMedia = isMediaDirective(name);
    const hasSource = hasSourceLabel(name);
    const settings = (
        <AttributesEditor
            title={`Attribute von ::${name}`}
            rows={directiveAttributesToRows(attributes)}
            onApply={(rows) => handle.updateAttrs({ attributes: rowsToDirectiveAttributes(rows) })}
        />
    );

    return (
        <>
            <NodeToolbar
                handle={handle}
                settings={settings}
                actionsWhenActive
                title={
                    <EditableTag
                        tag={`::${name}`}
                        attributes={directiveAttributes(attributes)}
                        source={directiveHeadOf(handle.node)}
                        parse={(text) => parseDirectiveHead(text, handle.node)}
                        onApply={(head) => handle.updateAttrs(head)}
                    />
                }
                shrinkTitle
                wideControls={hasSource}
            >
                <UuidAttributes handle={handle} />
                {hasSource ? (
                    <MediaSource handle={handle} />
                ) : (
                    <TextInput
                        value={label}
                        placeholder="Label"
                        noAutoFocus
                        onChange={(label) => handle.updateAttrs({ label })}
                    />
                )}
            </NodeToolbar>
            {isMedia && <MediaPreview name={name} src={label} attributes={attributes} />}
        </>
    );
});

export default LeafDirective;
