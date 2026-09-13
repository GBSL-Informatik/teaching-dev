import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type { CustomAction } from '..';
import JsTypeSwitcher from '../JsType/Switcher';
import type iParentable from '../models/iParentable';
import styles from './styles.module.scss';

export interface Props {
    schema: iParentable;
    className?: string;
    noName?: boolean;
    actions?: CustomAction[];
}

const JsSchemaEditor = observer((props: Props) => {
    const { schema } = props;
    return (
        <div className={clsx(styles.js, props.noName && styles.noName, props.className)}>
            {schema.value.map((js) => (
                <JsTypeSwitcher key={js.id} js={js} noName={props.noName} actions={props.actions} />
            ))}
        </div>
    );
});

export default JsSchemaEditor;
