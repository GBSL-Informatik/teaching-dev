import * as MdiIcons from '@mdi/js';
import Icon from '@mdi/react';
import TextInput from '@tdev-components/shared/TextInput';
import { camelCased, captialize } from '@tdev-plugins/helpers';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import AttributesEditor from '../../components/AttributesEditor';
import {
    directiveAttributesToRows,
    rowsToDirectiveAttributes
} from '../../components/AttributesEditor/conversions';
import InlinePopover from '../../components/InlinePopover';
import type { NodeViewProps } from '../ReactNodeView';
import styles from './styles.module.scss';

const mdiPath = (iconName: string): string | undefined => {
    const key = `mdi${captialize(camelCased(iconName))}`;
    return (MdiIcons as Record<string, string>)[key];
};

/**
 * `:name[label]{attributes}` - `:mdi[icon-name]` is rendered as the icon.
 */
const TextDirective = observer(({ handle }: NodeViewProps) => {
    const { name, label, attributes } = handle.node.attrs;
    const iconPath = name === 'mdi' ? mdiPath(label) : undefined;
    return (
        <InlinePopover
            title={`:${name}`}
            trigger={
                <span className={clsx(styles.directive, handle.selected && styles.selected)}>
                    {iconPath ? <Icon path={iconPath} size="1.25em" /> : `:${name}[${label}]`}
                </span>
            }
        >
            <TextInput label="Label" value={label} onChange={(label) => handle.updateAttrs({ label })} />
            <AttributesEditor
                title={`Attribute von :${name}`}
                rows={directiveAttributesToRows(attributes)}
                onApply={(rows) => handle.updateAttrs({ attributes: rowsToDirectiveAttributes(rows) })}
            />
        </InlinePopover>
    );
});

export default TextDirective;
