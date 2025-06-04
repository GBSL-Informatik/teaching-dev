import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import { useStore } from '@tdev-hooks/useStore';
import DefinitionList from '@tdev-components/DefinitionList';
import clsx from 'clsx';
import CopyBadge from '@tdev-components/shared/CopyBadge';
import siteConfig from '@generated/docusaurus.config';
import _ from 'lodash';
const { APP_URL } = siteConfig.customFields as {
    APP_URL?: string;
};

const SignupLinks = observer(() => {
    const signupTokenStore = useStore('signupTokenStore');
    const signupUrl = `${APP_URL || 'http://localhost:3000'}/signup`;

    return (
        <div className={styles.container}>
            {_.orderBy(signupTokenStore.signupTokens, ['createdAt', 'id']).map((token) => (
                <div key={token.id} className={styles.signupLink}>
                    <CopyBadge value={`${signupUrl}?token=${token.id}`} className={clsx(styles.nowrap)} />
                    <DefinitionList>
                        <dt>Beschreibung</dt>
                        <dd>{token.description}</dd>
                        <dt>Verwendungen</dt>
                        <dd>
                            {token.maxUses > 0 && (
                                <span
                                    className={clsx(
                                        'badge',
                                        token.uses >= token.maxUses ? 'badge--danger' : 'badge--primary'
                                    )}
                                >
                                    {token.uses} / {token.maxUses}
                                </span>
                            )}
                            {token.maxUses == 0 && (
                                <span className={clsx('badge', 'badge--secondary')}>{token.uses}</span>
                            )}
                        </dd>
                        <dt>Methode</dt>
                        <dd>{token.method}</dd>
                        <dt>Gültig bis</dt>
                        <dd>
                            <span
                                className={clsx(
                                    'badge',
                                    token.validThrough
                                        ? new Date() > token.validThrough
                                            ? 'badge--danger'
                                            : 'badge--primary'
                                        : 'badge--secondary'
                                )}
                            >
                                {token.validThrough ? token.fValidThrough : 'Unbegrenzt'}
                            </span>
                        </dd>
                        <dt>Erstellt</dt>
                        <dd>{token.fCreatedAt}</dd>
                        <dt>Aktualisiert</dt>
                        <dd>{token.fUpdatedAt}</dd>
                        <dt>Status</dt>
                        <dd>
                            <div className={clsx('button-group')}>
                                <button
                                    className={clsx(
                                        'button',
                                        'button--sm',
                                        token.disabled ? 'button--secondary' : 'button--primary'
                                    )}
                                    onClick={() => {
                                        token.setDisabled(false);
                                        token.save();
                                    }}
                                >
                                    Aktiviert
                                </button>
                                <button
                                    className={clsx(
                                        'button',
                                        'button--sm',
                                        token.disabled ? 'button--danger' : 'button--secondary'
                                    )}
                                    onClick={() => {
                                        token.setDisabled(true);
                                        token.save();
                                    }}
                                >
                                    Deaktiviert
                                </button>
                            </div>
                        </dd>
                    </DefinitionList>
                </div>
            ))}
        </div>
    );
});

export default SignupLinks;
