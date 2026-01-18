import * as React from 'react';
import Button from '@tdev-components/documents/CodeEditor/Button';
import { observer } from 'mobx-react-lite';
import { mdiDownload } from '@mdi/js';
import type iScript from '@tdev-models/documents/iScript';
import type { ScriptTypes } from '@tdev-api/document';

interface Props<T extends ScriptTypes> {
    script: iScript<T>;
}

const DownloadCode = observer(<T extends ScriptTypes>(props: Props<T>) => {
    const { script } = props;
    return (
        <Button
            icon={mdiDownload}
            onClick={() => {
                const downloadLink = document.createElement('a');
                const file = new Blob([script.code], { type: 'text/plain;charset=utf-8' });
                downloadLink.href = URL.createObjectURL(file);
                const fExt = script.lang === 'python' ? '.py' : `.${script.lang}`;
                const fTitle =
                    props.script.title === script.lang
                        ? script.id
                        : (script.title.split('/').pop() ?? script.id);
                const fName = fTitle.endsWith(fExt) ? fTitle : `${fTitle}${fExt}`;
                downloadLink.download = fName;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }}
            title={`Programm "${script.title}" herunterladen`}
        />
    );
});

export default DownloadCode;
