import { JsValue } from '@tdev-components/shared/JsObject/toJsSchema';
import JsTypeSwitcher from '@tdev-components/shared/JsObject/Viewer/JsType/Switcher';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';

export interface Props {
    schema: JsValue[];
    className?: string;
    nestingLevel: number;
}

const JsSchemaViewer = observer((props: Props) => {
    return (
        <div className={clsx(styles.js, props.className)}>
            {props.schema.map((js, idx) => (
                <JsTypeSwitcher key={idx} js={js} nestingLevel={props.nestingLevel} />
            ))}
        </div>
    );
});

export default JsSchemaViewer;
