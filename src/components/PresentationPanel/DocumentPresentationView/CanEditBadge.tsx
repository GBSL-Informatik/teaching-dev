import React from 'react';
import { observer } from 'mobx-react-lite';
import StudentGroup from '@tdev-models/StudentGroup';
import Badge from '@tdev-components/shared/Badge';
import { mdiEye, mdiMovieOpenPlay } from '@mdi/js';
import Icon from '@mdi/react';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';

interface Props {
    group: StudentGroup;
    hideText?: boolean;
}

const CanEditBadge = observer((props: Props) => {
    const { group } = props;
    if (!group.presentedDocument) {
        return null;
    }

    if (group.presentedDocument.canEdit) {
        return (
            <Badge color="orange">
                <Icon path={mdiMovieOpenPlay} size={SIZE_XS} /> {props.hideText ? null : 'Live'}
            </Badge>
        );
    }

    return (
        <Badge color="lightBlue">
            <Icon path={mdiEye} size={SIZE_XS} />
        </Badge>
    );
});

export default CanEditBadge;
