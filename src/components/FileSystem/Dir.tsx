import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import Icon from '@mdi/react';
import { mdiFolder, mdiFolderOpen } from '@mdi/js';
import File, { FileType } from './File';
import { ReactContextError } from '@docusaurus/theme-common';

export type DirType = {
    name: string;
    children: (DirType | FileType)[];
};

interface Props {
    dir: DirType;
    open: boolean | number;
    onSelect?: (fName?: string) => void;
    noSelect?: boolean;
    maxHeight?: string;
}

export const DirContext = React.createContext<string[]>([]);
export function useActivePath(): string[] {
    const context = React.useContext(DirContext);
    if (context === null) {
        throw new ReactContextError(
            'DocumentContextProvider',
            'The Component must be a child of the DocumentContextProvider component'
        );
    }
    return context;
}
const DirComponent = observer((props: Props & { level: number }) => {
    const { dir } = props;
    const [isOpen, setOpen] = React.useState(typeof props.open === 'boolean' ? props.open : props.open > 0);
    const activePath = useActivePath();

    const onSelect = React.useCallback(
        (name?: string) => {
            return props.onSelect?.(
                name === undefined ? undefined : `${dir.name}/${name}`.replace(/^\/+/, '/')
            );
        },
        [dir.name, props.onSelect]
    );

    const isActive = activePath[props.level] === dir.name;

    return (
        <li className={clsx(styles.dir, styles.item)}>
            <div className={clsx(styles.dirName)}>
                <span
                    className={clsx(styles.dir, props.level === 0 && styles.root)}
                    onClick={() => {
                        setOpen((prev) => !prev);
                        onSelect(isOpen ? undefined : '');
                    }}
                >
                    <Icon
                        path={isOpen ? mdiFolderOpen : mdiFolder}
                        size={0.8}
                        color={isOpen ? 'var(--ifm-color-blue)' : 'var(--ifm-color-gray-600)'}
                    />
                    <span className={clsx(styles.item, styles.name, isActive && styles.active)}>
                        {dir.name}
                    </span>
                </span>
            </div>
            {isOpen && dir.children.length > 0 && (
                <ul className={clsx(styles.subfolder)}>
                    {dir.children.map((child, idx) => {
                        if (typeof child === 'string') {
                            return (
                                <File
                                    key={idx}
                                    file={child}
                                    onSelect={onSelect}
                                    active={isActive && activePath[props.level + 1] === child}
                                />
                            );
                        }
                        return (
                            <DirComponent
                                key={idx}
                                level={props.level + 1}
                                dir={child}
                                open={typeof props.open === 'boolean' ? props.open : props.open - 1}
                                onSelect={onSelect}
                            />
                        );
                    })}
                </ul>
            )}
        </li>
    );
});

const Dir = observer((props: Props & { path?: string; className?: string }) => {
    const [path, setPath] = React.useState<string[]>(props.path ? props.path.split('/') : []);
    React.useEffect(() => {
        if (props.path) {
            console.log('set path', props.path);
            setPath(props.path.split('/'));
        }
    }, [props.path]);
    const onSelect = React.useCallback(
        (name?: string) => {
            if (props.noSelect) {
                return;
            }
            setPath(name ? name.split('/') : []);
            props.onSelect?.(name);
        },
        [props.onSelect, props.noSelect]
    );
    return (
        <DirContext.Provider value={path}>
            <div
                className={clsx(styles.rootContainer, props.className)}
                style={{ maxHeight: props.maxHeight }}
            >
                <DirComponent dir={props.dir} open={props.open} onSelect={onSelect} level={0} />
            </div>
        </DirContext.Provider>
    );
});
export default Dir;
