import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import { useStore } from '@tdev-hooks/useStore';
import useBaseUrl from '@docusaurus/useBaseUrl';

const SignupLinks = observer(() => {
    const adminStore = useStore('adminStore');
    const signupUrl = useBaseUrl('/signup');

    return (
        <div>
            {adminStore.signupTokens.map((token) => (
                <div key={token.id} className={styles.signupLink}>
                    <h3>{`${signupUrl}?token=${token.id}`}</h3>
                    <p>
                        Gültig bis:{' '}
                        {token.validThrough
                            ? new Date(token.validThrough).toLocaleDateString()
                            : 'Unbegrenzt'}
                    </p>
                    <p>Verwendungen: {token.uses}</p>
                    <p>Maximale Verwendungen: {token.maxUses > 0 ? token.maxUses : 'Unbegrenzt'}</p>
                    <p>Deaktiviert: {token.disabled ? 'Ja' : 'Nein'}</p>
                </div>
            ))}
        </div>
    );
});

export default SignupLinks;
