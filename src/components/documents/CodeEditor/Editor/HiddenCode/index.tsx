import * as React from 'react';
import styles from './styles.module.scss';
import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import Icon from '@mdi/react';
import { mdiArrowExpandDown, mdiArrowExpandUp } from '@mdi/js';
import _ from 'es-toolkit/compat';
import type { ScriptTypes } from '@tdev-api/document';
import type iScript from '@tdev-models/documents/iScript';

interface Props<T extends ScriptTypes> {
    type: 'pre' | 'post';
    script: iScript<T>;
}

const HiddenCode = observer(<T extends ScriptTypes>(props: Props<T>) => {
    const { script } = props;
    const [show, setShow] = React.useState(false);
    const code = props.type === 'pre' ? script.meta.preCode : script.meta.postCode;
    if (code.length === 0) {
        return null;
    }
    return (
        <div className={clsx(styles.container)}>
            {show && (
                <div>
                    <CodeBlock
                        language="python"
                        showLineNumbers={false}
                        className={clsx(
                            styles.hiddenCode,
                            styles.pre,
                            show && styles.open,
                            script.meta.slim && styles.slim
                        )}
                    >
                        {code}
                    </CodeBlock>
                </div>
            )}
            <button
                className={clsx(
                    styles.toggleButton,
                    show && styles.open,
                    styles[props.type],
                    script.codeLines <= 1 && styles.singleLine
                )}
                onClick={() => setShow(!show)}
                title={
                    show
                        ? `${_.capitalize(props.type)}-Code Einklappen`
                        : `${_.capitalize(props.type)}-Code Ausklappen`
                }
            >
                <Icon
                    path={props.type === 'pre' ? mdiArrowExpandUp : mdiArrowExpandDown}
                    rotate={show ? 180 : 0}
                    size={0.8}
                />
            </button>
        </div>
    );
});

export default HiddenCode;
