import Icon from '@mdi/react';
import TextInput from '@tdev-components/shared/TextInput';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import AttributesEditor from '../../components/AttributesEditor';
import AttributesForm, { type AttributeRow } from '../../components/AttributesEditor/AttributesForm';
import {
    directiveAttributesToRows,
    rowsToDirectiveAttributes
} from '../../components/AttributesEditor/conversions';
import IconPicker from '../../components/IconPicker';
import { mdiPath } from '../../components/IconPicker/mdiIcons';
import InlinePopover from '../../components/InlinePopover';
import type { NodeViewProps } from '../ReactNodeView';
import { mdiIconProps } from './mdiIconProps';
import styles from './styles.module.scss';

/**
 * `:name[label]{attributes}` - `:mdi[icon-name]` is rendered as the icon.
 * The attributes of an icon (size, color...) are edited directly in the popover.
 */
const TextDirective = observer(({ handle }: NodeViewProps) => {
    const { name, label, attributes } = handle.node.attrs;
    const isMdi = name === 'mdi';
    const iconPath = isMdi ? mdiPath(label) : undefined;
    const rows = directiveAttributesToRows(attributes);

    const handleLabelChange = (label: string) => handle.updateAttrs({ label });
    const handleApplyAttributes = (rows: AttributeRow[]) =>
        handle.updateAttrs({ attributes: rowsToDirectiveAttributes(rows) });

    return (
        <InlinePopover
            title={isMdi ? 'Icon' : `:${name}`}
            trigger={
                <span className={clsx(styles.directive, handle.selected && styles.selected)}>
                    {iconPath ? <Icon path={iconPath} {...mdiIconProps(attributes)} /> : `:${name}[${label}]`}
                </span>
            }
        >
            {isMdi ? (
                <>
                    <IconPicker value={label} onSelect={handleLabelChange} />
                    <AttributesForm rows={rows} onApply={handleApplyAttributes} applyOnClose />
                </>
            ) : (
                <>
                    <TextInput label="Label" value={label} onChange={handleLabelChange} />
                    <AttributesEditor
                        title={`Attribute von :${name}`}
                        rows={rows}
                        onApply={handleApplyAttributes}
                    />
                </>
            )}
        </InlinePopover>
    );
});

export default TextDirective;
