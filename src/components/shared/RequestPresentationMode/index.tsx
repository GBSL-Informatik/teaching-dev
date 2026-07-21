import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Button from '../Button';
import { mdiPresentationPlay, mdiTelevisionStop } from '@mdi/js';
import { Color } from '../Colors';
import { useStore } from '@tdev-hooks/useStore';
import { iPresentable, PresentableModelType } from '@tdev-api/document';

interface Props {
    document: iPresentable;
    size?: number;
    color?: Color | string;
    adminOnly?: boolean;
    className?: string;
}

const RequestPresentationMode = observer((props: Props) => {
    const { document, className } = props;
    const userStore = useStore('userStore');
    // React.useEffect(() => {
    //     return () => {
    //         if (props.adminOnly && userStore.current?.hasElevatedAccess) {
    //             document.setPresenting(false);
    //         }
    //     };
    // }, [props.adminOnly]);
    if (props.adminOnly && !userStore.current?.hasElevatedAccess) {
        return null;
    }
    if (document.isDummy) {
        return null;
    }
    return (
        <Button
            onClick={() => {
                console.log('sp', document.isPresenting, document.id);
                document.setPresenting(!document.isPresenting);
            }}
            className={className}
            color={props.color || 'blue'}
            size={props.size}
            title={document.isPresenting ? 'Präsentation beenden' : 'Präsentatieren'}
            icon={document.isPresenting ? mdiTelevisionStop : mdiPresentationPlay}
        />
    );
});

export default RequestPresentationMode;
