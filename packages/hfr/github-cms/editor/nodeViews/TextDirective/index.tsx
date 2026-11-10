import Icon from '@mdi/react';
import TextInput from '@tdev-components/shared/TextInput';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import AttributesEditor from '../../components/AttributesEditor';
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
 */
const TextDirective = observer(({ handle }: NodeViewProps) => {
    const { name, label, attributes } = handle.node.attrs;
    const iconPath = name === 'mdi' ? mdiPath(label) : undefined;
    return (
        <InlinePopover
            title={name === 'mdi' ? 'Icon' : `:${name}`}
            trigger={
                <span className={clsx(styles.directive, handle.selected && styles.selected)}>
                    {iconPath ? <Icon path={iconPath} {...mdiIconProps(attributes)} /> : `:${name}[${label}]`}
                </span>
            }
        >
            {name === 'mdi' ? (
                <IconPicker value={label} onSelect={(label) => handle.updateAttrs({ label })} />
            ) : (
                <TextInput label="Label" value={label} onChange={(label) => handle.updateAttrs({ label })} />
            )}
            <AttributesEditor
                title={`Attribute von :${name}`}
                rows={directiveAttributesToRows(attributes)}
                onApply={(rows) => handle.updateAttrs({ attributes: rowsToDirectiveAttributes(rows) })}
            />
        </InlinePopover>
    );
});

export default TextDirective;
