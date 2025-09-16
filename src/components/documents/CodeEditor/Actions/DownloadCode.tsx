import * as React from 'react';
import Button from '@tdev-components/documents/CodeEditor/Button';
import { observer } from 'mobx-react-lite';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { DocumentType } from '@tdev-api/document';
import { mdiDownload } from '@mdi/js';

const DownloadCode = observer((props: { title: string }) => {
    const script = useDocument<DocumentType.Script>();

    return (
        <Button
            icon={mdiDownload}
            onClick={() => {
                const downloadLink = document.createElement('a');
                const file = new Blob([script.code], { type: 'text/plain;charset=utf-8' });
                downloadLink.href = URL.createObjectURL(file);
                const fExt = script.lang === 'python' ? '.py' : `.${script.lang}`;
                const fTitle =
                    props.title === script.lang ? script.id : (props.title.split('/').pop() ?? script.id);
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
