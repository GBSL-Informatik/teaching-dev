import clsx from 'clsx';
import Layout from '@theme/Layout';

import { matchPath, useLocation } from '@docusaurus/router';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { observer } from 'mobx-react-lite';
import Loader from '@tdev-components/Loader';

interface Props {
    path: string;
}

const Rooms = observer((props: Props): JSX.Element => {
    const room = matchPath(props.path, '/rooms/:room');
    return <div>{JSON.stringify(room)}</div>;
});

const SwitchRooms = () => {
    const location = useLocation();
    return (
        <Layout title={`Räume`} description="Nachrichtenräume">
            <BrowserOnly fallback={<Loader />}>{() => <Rooms path={location.pathname} />}</BrowserOnly>
        </Layout>
    );
};

export default SwitchRooms;
