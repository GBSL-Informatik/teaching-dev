import Button from '@tdev-components/shared/Button';
import clsx from 'clsx';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import JsType from '../JsType';
import type { default as JsNullishModel } from '../models/JsNullish';
import styles from './styles.module.scss';

interface Props {
    js: JsNullishModel;
    noName?: boolean;
}
const JsNullish = observer((props: Props) => {
    const { js } = props;
    return (
        <JsType js={js} noName={props.noName}>
            <Button
                text={js.value === null ? 'Null' : 'Undefined'}
                onClick={action(() => {
                    js.setValue(js.value === null ? undefined : null);
                })}
                className={clsx(styles.nullish)}
                color="gray"
                active
            />
        </JsType>
    );
});

export default JsNullish;
