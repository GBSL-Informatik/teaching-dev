import React, { type ReactNode } from 'react';
import AnnouncementBar from '@theme-original/AnnouncementBar';
import type AnnouncementBarType from '@theme/AnnouncementBar';
import type { WrapperProps } from '@docusaurus/types';
import PresentationModal from '@tdev-components/PresentationPanel/PresentationModal';
import { observer } from 'mobx-react-lite';

type Props = WrapperProps<typeof AnnouncementBarType>;

const AnnouncementBarWrapper = observer((props: Props): ReactNode => {
    return (
        <>
            <PresentationModal />
            <AnnouncementBar {...props} />
        </>
    );
});

export default AnnouncementBarWrapper;
