import * as React from 'react';
import Button, { Color } from '@tdev-components/documents/CodeEditor/Button';
import styles from './styles.module.scss';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { mdiLoading } from '@mdi/js';
import iCode from '@tdev-models/documents/iCode';
import { CodeType } from '@tdev-api/document';

interface Props<T extends CodeType> {
    code: iCode<T>;
    onExecute?: () => void;
}

const Play =
    'M 7.4219 1.8281 c -0.6938 -0.4266 -1.5656 -0.4406 -2.2734 -0.0422 S 4 2.9344 4 3.75 V 20.25 c 0 0.8156 0.4406 1.5656 1.1484 1.9641 s 1.5797 0.3797 2.2734 -0.0422 L 20.9219 13.9219 c 0.6703 -0.4078 1.0781 -1.1344 1.0781 -1.9219 s -0.4078 -1.5094 -1.0781 -1.9219 L 7.4219 1.8281 Z';

const RunCode = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    return (
        <Button
            icon={code.isExecuting ? mdiLoading : Play}
            spin={code.isExecuting}
            color={Color.Success}
            className={clsx(styles.runCode, code.meta.slim && styles.slim)}
            iconSize={code.meta.slim ? '1.15em' : '1.6em'}
            onClick={() => {
                props.onExecute?.();
            }}
            title={`${code.title} ausführen`}
        />
    );
});

export default RunCode;
