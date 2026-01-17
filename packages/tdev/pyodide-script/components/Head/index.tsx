import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import { mdiClose, mdiLoading, mdiPlay } from '@mdi/js';
import PyodideScript from '../../models/PyodideScript';
interface Props {
    title?: string;
    code: PyodideScript;
}
const Head = observer((props: Props) => {
    const { code } = props;
    const viewStore = useStore('viewStore');
    const pyodideStore = viewStore.useStore('pyodideStore');
    return (
        <div className={clsx(styles.header)}>
            <h3 className={clsx(styles.title)}>{props.title ?? 'Python'}</h3>
            <div className={clsx(styles.actions)}>
                <Button
                    icon={code.isExecuting ? mdiLoading : mdiPlay}
                    spin={code.isExecuting}
                    color="green"
                    onClick={(e) => {
                        pyodideStore.run(code);
                    }}
                />
                {code.isExecuting && (
                    <Button
                        icon={mdiClose}
                        onClick={() => {
                            code.pyodideStore.recreatePyWorker();
                        }}
                    />
                )}
            </div>
        </div>
    );
});

export default Head;
