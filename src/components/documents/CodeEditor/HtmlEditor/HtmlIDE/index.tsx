import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Dir, { DirType } from '@tdev-components/FileSystem/Dir';
import HtmlEditor from '..';
import { MultiCode } from '@tdev-plugins/remark-code-as-attribute/plugin';
import { extractMetaProps } from '@tdev/theme/CodeBlock';
import { resolvePath } from '@tdev-models/helpers/resolvePath';

interface MetaProps {
    id?: string;
    path: string;
    hideWarning?: boolean | string | number;
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
    assets?: Record<string, string>;
}

interface WrapperProps {
    file: DirFile;
    onNavigate?: (href: string) => void;
    transformer?: ((s: string) => string)[];
    hideWarning?: boolean;
}

const HtmlEditorWrapper = observer((props: WrapperProps) => {
    const { file } = props;
    const htmlTransformer = React.useCallback(
        (raw: string) => {
            if (!props.transformer) {
                return raw;
            }
            return props.transformer.reduce((acc, t) => t(acc), raw);
        },
        [props.transformer]
    );

    return (
        <div className={clsx(styles.editor)}>
            <HtmlEditor
                key={file.path}
                id={file?.id}
                minHeight={'8em'}
                code={file?.code}
                title={file?.path}
                onNavigate={props.onNavigate}
                htmlTransformer={htmlTransformer}
                hideWarning={props.hideWarning}
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
        [...files.map((f) => f.path), ...Object.keys(props.assets || {})].forEach((f) => {
            const parts = f.split('/').filter((p) => p.length > 0);
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
    }, [files, props.assets, props.dir]);

    const [selectedFile, setSelectedFile] = React.useState<DirFile | null>(null);

    const transformer = React.useMemo(() => {
        const fileParts = (selectedFile?.path.split('/') || []).slice(0, -1).filter((p) => p.length > 0);
        const relTransformers: ((raw: string) => string)[] = [];
        Object.entries(props.assets || {}).forEach(([key, val]) => {
            const parts = key.split('/').filter((p) => p.length > 0);
            const fParts = [...fileParts];
            while (fParts[0] === parts[0]) {
                fParts.shift();
                parts.shift();
            }
            if (fParts.length === 0) {
                parts.splice(0, 0, '.');
            } else {
                parts.splice(0, 0, ...new Array(fParts.length).fill('..'));
            }
            relTransformers.push((raw: string) => raw.replaceAll(`"${key}"`, `"${val}"`));
            relTransformers.push((raw: string) => raw.replaceAll(`"${parts.join('/')}"`, `"${val}"`));
        });
        return relTransformers;
    }, [props.assets, selectedFile]);
    const onSelect = React.useCallback(
        (fName?: string) => {
            if (fName && !fName.endsWith('.html')) {
                return;
            }
            if (!fName) {
                setSelectedFile(null);
                return;
            }
            let absPath = fName;
            if (fName.startsWith('.')) {
                const basePathParts = (selectedFile?.meta.path.split('/') ?? [])
                    .slice(0, -1)
                    .filter((a) => a.length > 0);
                absPath = `/${resolvePath(...basePathParts, fName.replace(/^\.\//, ''))}`;
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
            <HtmlEditorWrapper
                file={selectedFile || files[0]}
                onNavigate={onSelect}
                transformer={transformer}
                hideWarning={!!selectedFile?.meta?.hideWarning}
            />
        </div>
    );
});

export default HtmlIDE;
