import { mdiTune } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import Popup from 'reactjs-popup';
import { type AttributeOption, attributeOptions } from '../../../../assessable/attributeOptions';
import type { JsxAttribute } from '../../../../schema';
import type { NodeViewProps } from '../../../ReactNodeView';
import FlagControl from './FlagControl';
import NumberControl from './NumberControl';
import SelectControl from './SelectControl';
import styles from './styles.module.scss';

/**
 * The documented attributes of a question or quiz less often changed, in a dropdown.
 * Changes apply immediately, values not written as literals are edited in the tag.
 */
const AttributeOptions = observer(({ handle }: NodeViewProps) => {
    const options = attributeOptions(handle.node);
    if (options.length === 0) {
        return null;
    }
    const attributes: JsxAttribute[] = handle.node.attrs.attributes;

    const handleChange = (updated: JsxAttribute[]) => handle.updateAttrs({ attributes: updated });
    const control = (option: AttributeOption) => {
        switch (option.kind) {
            case 'flag':
                return <FlagControl option={option} attributes={attributes} onChange={handleChange} />;
            case 'select':
                return <SelectControl option={option} attributes={attributes} onChange={handleChange} />;
            case 'number':
                return <NumberControl option={option} attributes={attributes} onChange={handleChange} />;
        }
    };

    return (
        <Popup
            trigger={
                <span>
                    <Button icon={mdiTune} size={SIZE_S} text="Optionen" title="Weitere Einstellungen" />
                </span>
            }
            position={['bottom left', 'bottom right', 'top left']}
            on="click"
            closeOnDocumentClick
            nested
            arrow={false}
        >
            <Card classNames={{ card: clsx(styles.options) }}>
                {options.map((option) => (
                    <div key={option.name} className={clsx(styles.option)} title={option.title}>
                        {control(option)}
                    </div>
                ))}
            </Card>
        </Popup>
    );
});

export default AttributeOptions;
