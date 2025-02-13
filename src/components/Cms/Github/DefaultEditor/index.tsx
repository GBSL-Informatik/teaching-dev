import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import CodeEditor from '@tdev-components/shared/CodeEditor';
import Actions from '@tdev-components/Cms/MdxEditor/toolbar/Actions';
import File from '@tdev-models/cms/File';
import { action } from 'mobx';

interface Props {
    file: File;
}

const DefaultEditor = observer((props: Props) => {
    const { file } = props;
    if (!file || file.type !== 'file') {
        return null;
    }

    return (
        <div className={clsx(styles.codeEditor)}>
            <div className={clsx(styles.header)}>
                <div>{file.path}</div>
                <Actions file={file} />
            </div>
            <CodeEditor
                lang={file.extension}
                value={file.content}
                maxLines={60}
                onChange={action((code) => file.setContent(code))}
            />
        </div>
    );
});

export default DefaultEditor;
