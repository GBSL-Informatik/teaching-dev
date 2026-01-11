import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';

interface Props {}
import { usePyodideLib } from '../hooks/usePyodide';
import Button from '@tdev-components/shared/Button';

const PyodScript = observer((props: Props) => {
    const pyodide = usePyodideLib();
    if (!pyodide) {
        return <div>Loading Pyodide...</div>;
    }

    return (
        <div className={clsx(styles.PyodScript)}>
            <Button
                text="Run"
                onClick={async () => {
                    const res = await pyodide.runPythonAsync(`print("Hello from Pyodide")`);
                    console.log(res);
                }}
            />
        </div>
    );
});

export default PyodScript;
