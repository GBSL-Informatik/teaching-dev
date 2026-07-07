import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { adminClient } from 'better-auth/client/plugins';
import { oneTimeTokenClient } from 'better-auth/client/plugins';
import { adminAc, userAc } from 'better-auth/plugins/admin/access';
import { teacher } from './helpers/auth-permissions';
import customFields from '@tdev-components/utils/customFields';

export const { BACKEND_URL } = customFields;

export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: BACKEND_URL,
    plugins: [
        adminClient({
            roles: {
                admin: adminAc,
                teacher: teacher,
                student: userAc
            }
        }),
        oneTimeTokenClient(),
        inferAdditionalFields({
            user: {
                firstName: {
                    type: 'string'
                },
                lastName: {
                    type: 'string'
                }
            }
        })
    ]
});
