import * as React from 'react';
import styles from './styles.module.scss';
import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import Icon from '@mdi/react';
import { mdiArrowExpandDown, mdiArrowExpandUp } from '@mdi/js';
import _ from 'es-toolkit/compat';
import type { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';

interface Props<T extends CodeType> {
    type: 'pre' | 'post';
    code: iCode<T>;
}

const HiddenCode = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    const [show, setShow] = React.useState(false);
    const codeContent = props.type === 'pre' ? code.meta.preCode : code.meta.postCode;
    if (codeContent.length === 0) {
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
                            code.meta.slim && styles.slim
                        )}
                    >
                        {codeContent}
                    </CodeBlock>
                </div>
            )}
            <button
                className={clsx(
                    styles.toggleButton,
                    show && styles.open,
                    styles[props.type],
                    code.codeLines <= 1 && styles.singleLine
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
