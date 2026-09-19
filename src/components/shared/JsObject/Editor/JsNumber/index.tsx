import TextInput from '@tdev-components/shared/TextInput';
import clsx from 'clsx';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import JsType from '../JsType';
import type { default as JsNumberModel } from '../models/JsNumber';
import styles from './styles.module.scss';

interface Props {
    js: JsNumberModel;
    noName?: boolean;
}
const JsNumber = observer((props: Props) => {
    const { js } = props;
    return (
        <JsType js={js} noName={props.noName}>
            <TextInput
                type="number"
                value={js._inputValue}
                onChange={action((value) => {
                    js.setValue(value);
                })}
                validator={(text) => {
                    if (isNaN(Number(text))) {
                        return 'Bitte eine gültige Zahl eingeben';
                    }
                    return null;
                }}
                className={clsx(styles.jsNumber)}
                noAutoFocus
            />
        </JsType>
    );
});

export default JsNumber;
