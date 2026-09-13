import TextAreaInput from '@tdev-components/shared/TextAreaInput';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import JsType from '../JsType';
import type { default as JsStringModel } from '../models/JsString';
import styles from './styles.module.scss';

interface Props {
    js: JsStringModel;
    noName?: boolean;
}

const JsString = observer((props: Props) => {
    const { js } = props;
    return (
        <JsType js={js} noName={props.noName}>
            <div className={clsx(styles.jsString)}>
                <TextAreaInput
                    defaultValue={js.value}
                    onChange={(value) => {
                        js.setValue(value);
                    }}
                    placeholder="Text..."
                    className={clsx(styles.textArea, styles.string)}
                    noAutoFocus
                />
            </div>
        </JsType>
    );
});

export default JsString;
