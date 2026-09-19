import { mdiDownload } from '@mdi/js';
import type { CodeType } from '@tdev-api/document';
import Button from '@tdev-components/documents/CodeEditor/Button';
import type iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const DownloadCode = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    return (
        <Button
            icon={mdiDownload}
            onClick={() => {
                const downloadLink = document.createElement('a');
                const file = new Blob([code.code], { type: 'text/plain;charset=utf-8' });
                downloadLink.href = URL.createObjectURL(file);
                const fExt = code.lang === 'python' ? '.py' : `.${code.lang}`;
                const fTitle =
                    props.code.title === code.lang ? code.id : (code.title.split('/').pop() ?? code.id);
                const fName = fTitle.endsWith(fExt) ? fTitle : `${fTitle}${fExt}`;
                downloadLink.download = fName;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }}
            title={`Programm "${code.title}" herunterladen`}
        />
    );
});

export default DownloadCode;
