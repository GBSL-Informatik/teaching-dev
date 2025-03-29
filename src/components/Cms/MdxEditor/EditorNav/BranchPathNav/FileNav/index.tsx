import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import File from '@tdev-models/cms/File';
import BinFile from '@tdev-models/cms/BinFile';
import FileStub from '@tdev-models/cms/FileStub';
import NavItem from '@tdev-components/Cms/MdxEditor/EditorNav/BranchPathNav/NavItem';

interface Props {
    file: File | BinFile | FileStub;
    isActive?: boolean;
    linkToGithub?: boolean;
    className?: string;
}

const FileNav = observer((props: Props) => {
    const { file } = props;
    const cmsStore = useStore('cmsStore');

    return (
        <NavItem
            onClick={() => {
                cmsStore.setActiveEntry(file);
            }}
            href={props.linkToGithub ? file.htmlUrl : undefined}
            color={file.iconColor}
            icon={file.icon}
            name={file.name}
            isActive={props.isActive}
            className={clsx(props.className)}
        />
    );
});

export default FileNav;
