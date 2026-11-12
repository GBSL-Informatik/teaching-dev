import customFields from '@tdev-components/utils/customFields';
import SessionStorage from '@tdev-stores/utils/SessionStorage';
const { APP_URL, GH_OAUTH_CLIENT_ID } = customFields;

const CALLBACK_URL = `${APP_URL || 'http://localhost:3000'}/gh-callback`;

/**
 * The `state` protects the callback against login CSRF: a code is only accepted
 * when it belongs to a login started in this browser tab.
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-10.12
 */
export const createGithubLoginUrl = () => {
    const state = crypto.randomUUID();
    SessionStorage.set('GithubOAuthState', state);

    const params = new URLSearchParams({
        client_id: GH_OAUTH_CLIENT_ID ?? '',
        scope: 'repo',
        redirect_uri: CALLBACK_URL,
        state: state
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

/** a state can only be used once */
export const consumeGithubLoginState = (state: string | null) => {
    const expected = SessionStorage.get<string>('GithubOAuthState');
    SessionStorage.remove('GithubOAuthState');
    return !!state && state === expected;
};
