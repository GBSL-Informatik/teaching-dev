import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useCmsStore } from '@tdev/github-cms/hooks/useCmsStore';
import File from '@tdev/github-cms/models/File';
import BinFile from '@tdev/github-cms/models/BinFile';
import FileStub from '@tdev/github-cms/models/FileStub';
import NavItem from '@tdev/github-cms/components/MdxEditor/EditorNav/BranchPathNav/NavItem';

interface Props {
    file: File | BinFile | FileStub;
    isActive?: boolean;
    linkToGithub?: boolean;
    className?: string;
}

const FileNav = observer((props: Props) => {
    const { file } = props;
    const cmsStore = useCmsStore();

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
