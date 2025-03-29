import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import CodeEditor from '@tdev-components/shared/CodeEditor';
import Actions from '@tdev-components/Cms/MdxEditor/toolbar/Actions';
import File from '@tdev-models/cms/File';
import { action } from 'mobx';
import { mdiLanguageMarkdown } from '@mdi/js';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import Button from '@tdev-components/shared/Button';

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
                <Actions file={file} />
                <div>{file.path}</div>
                {file.isMarkdown && (
                    <Button
                        icon={mdiLanguageMarkdown}
                        color="blue"
                        size={SIZE_S}
                        onClick={() => file.setPreventMdxEditor(false)}
                    />
                )}
            </div>
            <CodeEditor
                lang={file.extension}
                defaultValue={file.content}
                maxLines={60}
                onChange={action((code) => file.setContent(code))}
            />
        </div>
    );
});

export default DefaultEditor;
