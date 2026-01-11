import React from 'react';
import Button from '@tdev-components/shared/Button';
import TextAreaInput from '@tdev-components/shared/TextAreaInput';
import { useStore } from '@tdev-hooks/useStore';
import { mdiLoading, mdiPlay } from '@mdi/js';
import Card from '@tdev-components/shared/Card';
import { observer } from 'mobx-react-lite';
import CodeBlock from '@theme-original/CodeBlock';
const SimpleScript = observer(() => {
    const [code, setCode] = React.useState('print("Hello from Pyodide")');
    const [error, setError] = React.useState('');
    const [result, setResult] = React.useState('');
    const viewStore = useStore('viewStore');
    const pyodideStore = viewStore.useStore('pyodideStore');

    return (
        <Card>
            <TextAreaInput defaultValue={code} onChange={(t) => setCode(t)} monospace />
            <Button
                text={'Run'}
                spin={!pyodideStore.isInitialized}
                icon={pyodideStore.isInitialized ? mdiPlay : mdiLoading}
                onClick={async () => {
                    const result = await pyodideStore.pyWorker?.run(code);
                    if (result?.type === 'error') {
                        setResult('');
                        setError(result?.error || 'Unknown error');
                    } else {
                        setError('');
                        setResult(result?.result as string);
                        console.log('Result from Pyodide:', result);
                    }
                }}
            />
            <CodeBlock language="python">{error ? `# Error:\n${error}` : `# Result:\n${result}`}</CodeBlock>
        </Card>
    );
});

export default SimpleScript;
