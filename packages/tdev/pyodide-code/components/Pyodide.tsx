import React from 'react';
import { observer } from 'mobx-react-lite';
import { CodeEditor, Props } from '@tdev-components/documents/CodeEditor';

const Pyodide = observer((props: Props) => {
    return <CodeEditor liveCodeType="live_pyo" {...props} />;
});

export default Pyodide;
