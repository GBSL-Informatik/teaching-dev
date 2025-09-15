import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Dir, { DirType } from '@tdev-components/FileSystem/Dir';
import HtmlEditor from '..';
import { MultiCode } from '@tdev-plugins/remark-code-as-attribute/plugin';
import { extractMetaProps } from '@tdev/theme/CodeBlock';
import { resolvePath } from '@tdev-models/helpers/resolvePath';

interface MetaProps {
    id?: string;
    path: string;
}

interface DirFile {
    meta: MetaProps;
    path: string;
    id?: string;
    lang: string;
    code: string;
}

interface Props {
    files: MultiCode[];
    dir?: DirType;
}

const HtmlEditorWrapper = observer((props: { file: DirFile; onNavigate?: (href: string) => void }) => {
    const { file } = props;
    return (
        <div className={clsx(styles.editor)}>
            <HtmlEditor
                key={file.path}
                id={file?.id}
                minHeight={'8em'}
                code={file?.code}
                title={file?.path}
                onNavigate={props.onNavigate}
            />
        </div>
    );
});

const HtmlIDE = observer((props: Props) => {
    const files = React.useMemo(() => {
        return (props.files || [])
            .map((f) => {
                const meta = extractMetaProps({ metastring: f.meta || '' });
                return {
                    meta: meta as MetaProps,
                    path: (meta as { path: string }).path,
                    id: (meta as { id?: string }).id,
                    lang: f.lang,
                    code: f.code
                } as DirFile;
            })
            .filter((f) => f.lang && f.meta.path);
    }, [props.files]);

    const fileTree = React.useMemo(() => {
        const fs: DirType = props.dir ?? {
            name: '/',
            children: []
        };
        files.forEach((f) => {
            const parts = f.meta.path.split('/').filter((p) => p.length > 0);
            let currentDir = fs;
            parts.forEach((part, idx) => {
                const isLast = idx === parts.length - 1;
                const nextItem = currentDir.children.find((c) => typeof c === 'object' && c.name === part) as
                    | DirType
                    | undefined;
                if (nextItem) {
                    currentDir = nextItem;
                } else {
                    if (isLast) {
                        currentDir.children.push(part);
                    } else {
                        const newDir: DirType = { name: part, children: [] };
                        currentDir.children.push(newDir);
                        currentDir = newDir;
                    }
                }
            });
        });
        return fs;
    }, [files, props.dir]);

    const [selectedFile, setSelectedFile] = React.useState<DirFile | null>(null);
    const onSelect = React.useCallback(
        (fName?: string) => {
            console.log('select', fName);
            if (!fName) {
                setSelectedFile(null);
                return;
            }
            let absPath = fName;
            if (fName.startsWith('.')) {
                const basePathParts = (selectedFile?.meta.path.split('/') ?? []).slice(0, -1);
                const basePath = basePathParts.join('/');
                absPath = `/${resolvePath(basePath, fName)}`;
                console.log('resolve', fName, '->', absPath);
            }
            const file = files.find((f) => f.meta.path === absPath);
            setSelectedFile(file || null);
        },
        [files, selectedFile]
    );

    return (
        <div className={clsx(styles.ide)}>
            <Dir
                open
                dir={fileTree}
                className={clsx(styles.dir)}
                onSelect={onSelect}
                path={selectedFile?.path}
            />
            <HtmlEditorWrapper file={selectedFile || files[0]} onNavigate={onSelect} />
        </div>
    );
});

export default HtmlIDE;
