import React from 'react';
import Button from '@tdev-components/shared/Button';
import TextAreaInput from '@tdev-components/shared/TextAreaInput';
import TextInput from '@tdev-components/shared/TextInput';
import { useStore } from '@tdev-hooks/useStore';
import { mdiLoading, mdiPlay } from '@mdi/js';
import Card from '@tdev-components/shared/Card';
import { observer } from 'mobx-react-lite';
import CodeBlock from '@theme-original/CodeBlock';
const s1 = `from time import sleep
def foo():
  print('a')
  sleep(2)
  print('b')

def a():
  print('->')
  sleep(1)
  foo()
  return 13
a()
`;
const s2 = `import numpy as np
a = np.array([1,2,3]) * 2
for i in a:
    print(i)
`;
const s0 = 'print("Hello from Pyodide!")';
const s4 = `name = input("What is your name? ")
print(f"Hello, {name}!")`;
const SimpleScript = observer(() => {
    const [code, setCode] = React.useState(s4);
    const [error, setError] = React.useState('');
    const [result, setResult] = React.useState('');
    const [inp, setInp] = React.useState('');
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
                    const result = await pyodideStore.runCode(code);
                    if (result?.type === 'error') {
                        pyodideStore.logs.push(`Error: ${result.error}`);
                    }
                }}
            />
            <TextInput
                value={inp}
                readOnly={pyodideStore.awaitingInputIds.size === 0}
                placeholder={pyodideStore.awaitingInputPrompt.get(pyodideStore.currentPromptId || '') || ''}
                onChange={(text) => {
                    setInp(text);
                }}
                onEnter={() => {
                    pyodideStore.sendInputResponse(pyodideStore.currentPromptId || '', inp);
                    setInp('');
                }}
                onEscape={() => {
                    pyodideStore.cancelCodeExecution();
                    setInp('');
                }}
            />
            <CodeBlock language="python">{pyodideStore.log}</CodeBlock>
        </Card>
    );
});

export default SimpleScript;
