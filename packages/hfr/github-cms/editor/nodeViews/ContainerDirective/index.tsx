import { mdiFormatTitle } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import SelectInput from '@tdev-components/shared/SelectInput';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { observer } from 'mobx-react-lite';
import type { Node } from 'prosemirror-model';
import AttributesEditor from '../../components/AttributesEditor';
import {
    directiveAttributesToRows,
    rowsToDirectiveAttributes
} from '../../components/AttributesEditor/conversions';
import NodeToolbar from '../../components/NodeToolbar';
import UuidAttributes from '../../components/UuidAttributes';
import { schema } from '../../schema';
import { CONTAINER_DIRECTIVES_WITHOUT_LABEL } from '../../suggestions/directiveNames';
import type { NodeViewProps } from '../ReactNodeView';
import AdmonitionIcon from './AdmonitionIcon';
import { ADMONITION_TYPES } from './admonitionTypes';

const ADMONITION_COLORS: Record<string, string> = {
    note: 'secondary',
    tip: 'success',
    info: 'info',
    warning: 'warning',
    caution: 'warning',
    danger: 'danger'
};

const isAdmonition = (name: string) => (ADMONITION_TYPES as readonly string[]).includes(name);

const hasLabel = (node: Node) => node.firstChild?.type === schema.nodes.directive_label;

/**
 * Admonitions are styled like the rendered page, other directives (details, flex, cards...)
 * are shown as a generic box.
 */
export const containerDirectiveClassName = (node: Node) => {
    const { name } = node.attrs;
    if (isAdmonition(name)) {
        return `cms-directive alert alert--${ADMONITION_COLORS[name] ?? 'info'}`;
    }
    return `cms-directive cms-directive--${name}`;
};

const ContainerDirective = observer(({ handle }: NodeViewProps) => {
    const { name, attributes } = handle.node.attrs;
    const canAddLabel = !hasLabel(handle.node) && !CONTAINER_DIRECTIVES_WITHOUT_LABEL.includes(name);

    const handleAddLabel = () => {
        handle.prependChild(schema.nodes.directive_label.create(null, schema.text('Titel')));
    };

    const title = isAdmonition(name) ? (
        <>
            <AdmonitionIcon type={name} />
            {`:::${name}`}
        </>
    ) : (
        `:::${name}`
    );

    return (
        <NodeToolbar handle={handle} title={title}>
            <UuidAttributes handle={handle} />
            {isAdmonition(name) && (
                <SelectInput
                    options={[...ADMONITION_TYPES]}
                    value={name}
                    onChange={(name) => handle.updateAttrs({ name })}
                />
            )}
            {canAddLabel && (
                <Button
                    icon={mdiFormatTitle}
                    size={SIZE_S}
                    title="Titel hinzufügen"
                    onClick={handleAddLabel}
                />
            )}
            <AttributesEditor
                title={`Attribute von :::${name}`}
                rows={directiveAttributesToRows(attributes)}
                onApply={(rows) => handle.updateAttrs({ attributes: rowsToDirectiveAttributes(rows) })}
            />
        </NodeToolbar>
    );
});

export default ContainerDirective;
