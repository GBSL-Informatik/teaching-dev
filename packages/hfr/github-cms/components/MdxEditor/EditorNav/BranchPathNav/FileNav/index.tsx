import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useCmsStore } from '../../../../../hooks/useCmsStore';
import File from '../../../../../models/File';
import BinFile from '../../../../../models/BinFile';
import FileStub from '../../../../../models/FileStub';
import NavItem from '../../../../MdxEditor/EditorNav/BranchPathNav/NavItem';

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
