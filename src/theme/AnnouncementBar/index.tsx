import type { WrapperProps } from '@docusaurus/types';
import PresentationModal from '@tdev-components/PresentationPanel/PresentationModal';
import { useStore } from '@tdev-hooks/useStore';
import AnnouncementBar from '@theme-original/AnnouncementBar';
import type AnnouncementBarType from '@theme/AnnouncementBar';
import { observer } from 'mobx-react-lite';
import { type ReactNode } from 'react';

type Props = WrapperProps<typeof AnnouncementBarType>;

const AnnouncementBarWrapper = observer((props: Props): ReactNode => {
    const sessionStore = useStore('sessionStore');
    return (
        <>
            {sessionStore.apiMode === 'api' && <PresentationModal />}
            <AnnouncementBar {...props} />
        </>
    );
});

export default AnnouncementBarWrapper;
