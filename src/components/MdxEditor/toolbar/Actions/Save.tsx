import React from 'react';
import { observer } from 'mobx-react-lite';
import _ from 'lodash';
import File from '@tdev-models/cms/File';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Loader from '@tdev-components/Loader';
import Button from '@tdev-components/shared/Button';
import { mdiContentSave } from '@mdi/js';
import { Color } from '@tdev-components/shared/Colors';

export interface Props {
    file: File;
    showIcon?: boolean;
    color?: Color | string;
    className?: string;
}

const Save = observer((props: Props) => {
    const { file } = props;
    return (
        <Button
            icon={props.showIcon ? mdiContentSave : undefined}
            onClick={() => {
                file.save();
            }}
            text="Speichern"
            disabled={!file.isDirty}
            color={props.color ?? 'green'}
            className={props.className}
        />
    );
});

export default Save;
