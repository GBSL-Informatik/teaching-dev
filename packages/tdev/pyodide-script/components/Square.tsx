import React from 'react';
import Button from '@tdev-components/shared/Button';
import { useStore } from '@tdev-hooks/useStore';
import { mdiLoading, mdiPlay } from '@mdi/js';
import { observer } from 'mobx-react-lite';
const Square = observer(() => {
    const [number, setNumber] = React.useState(5);
    const viewStore = useStore('viewStore');
    const pyodideStore = viewStore.useStore('pyodideStore');

    return (
        <Button
            text={`Calculate Square of ${number}`}
            spin={!pyodideStore.isInitialized}
            icon={pyodideStore.isInitialized ? mdiPlay : mdiLoading}
            onClick={async () => {
                const result = await pyodideStore.squareWorker?.square(number);
                console.log(
                    `Square of ${number} from worker is ${JSON.stringify(result, null, 2)}`,
                    pyodideStore.squareWorker
                );
                setNumber(Math.floor(Math.random() * 100));
            }}
        />
    );
});

export default Square;
