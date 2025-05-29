import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import StudentGroupPanel from '@tdev-components/Admin/StudentGroupPanel';
import UserTable from '@tdev-components/Admin/UserTable';
import AllowedActions from '../AllowedActions';
import SignupLinks from '../SignupLinks';

const AdminPanel = observer(() => {
    const userStore = useStore('userStore');
    if (!userStore.current?.hasElevatedAccess) {
        return (
            <div className="hero shadow--lw">
                <div className="container">
                    <h1 className="hero__title">Admin Panel</h1>
                    <p className="hero__subtitle">Nur für Administrator:innen sichtbar</p>
                </div>
            </div>
        );
    }
    return (
        <div>
            <Tabs queryString="panel">
                <TabItem value="studentGroups" label="Lerngruppen">
                    <StudentGroupPanel />
                </TabItem>
                <TabItem value="accounts" label="Accounts">
                    <UserTable />
                </TabItem>
                <TabItem value="signupLinks" label="Registrierungslinks">
                    <SignupLinks />
                </TabItem>
                <TabItem value="allowedActions" label="Erlaubte Aktionen">
                    <AllowedActions />
                </TabItem>
            </Tabs>
        </div>
    );
});

export default AdminPanel;
