import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import { useStore } from '@tdev-hooks/useStore';
import DefinitionList from '@tdev-components/DefinitionList';
import clsx from 'clsx';
import CopyBadge from '@tdev-components/shared/CopyBadge';
import siteConfig from '@generated/docusaurus.config';
import _ from 'lodash';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import {
    mdiCircleEditOutline,
    mdiCloseCircleOutline,
    mdiContentSave,
    mdiDeleteOutline,
    mdiInfinity,
    mdiPlusCircleOutline
} from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import SignupToken from '@tdev-models/SignupToken';
import React from 'react';
import { action } from 'mobx';
const { APP_URL } = siteConfig.customFields as {
    APP_URL?: string;
};

interface SignupTokenProps {
    token: SignupToken;
}

const SignupLink = observer(({ token }: SignupTokenProps) => {
    const signupTokenStore = useStore('signupTokenStore');
    const signupUrl = `${APP_URL || 'http://localhost:3000'}/signup`;

    return (
        <div key={token.id} className={styles.signupLink}>
            <div className={clsx(styles.info)}>
                <CopyBadge value={`${signupUrl}?token=${token.id}`} className={clsx(styles.linkBadge)} />
                <DefinitionList>
                    <dt>Beschreibung</dt>
                    <dd>
                        {token.isEditing ? (
                            <textarea
                                placeholder="Beschreibung..."
                                value={token.description}
                                className={clsx(styles.textarea)}
                                onChange={(e) => {
                                    token.setDescription(e.target.value);
                                }}
                                tabIndex={1}
                            />
                        ) : (
                            token.description
                        )}
                    </dd>
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
                    {token.isEditing && (
                        <>
                            <dt>Max. Verwendungen</dt>
                            <dd>
                                <div className={clsx(styles.inputWithButton)}>
                                    <input
                                        type="number"
                                        placeholder="Max. Verwendungen..."
                                        value={token.maxUses}
                                        min={0}
                                        className={clsx(styles.numberInput)}
                                        onChange={(e) => {
                                            token.setMaxUses(parseInt(e.target.value, 10) || 0);
                                        }}
                                        autoFocus
                                        tabIndex={2}
                                        onFocus={(inp) => {
                                            inp.target.select();
                                        }}
                                    />
                                    <Button
                                        icon={mdiInfinity}
                                        color="black"
                                        className={clsx(styles.button)}
                                        onClick={() => token.setMaxUses(0)}
                                    />
                                </div>
                            </dd>
                        </>
                    )}
                    <dt>Methode</dt>
                    <dd>{token.method}</dd>
                    <dt>Gültig bis</dt>
                    <dd>
                        {token.isEditing ? (
                            <div className={clsx(styles.inputWithButton)}>
                                <input
                                    type="datetime-local"
                                    value={
                                        token.validThrough
                                            ? token.validThrough.toISOString().slice(0, 16)
                                            : ''
                                    }
                                    onChange={(e) =>
                                        token.setValidThrough(
                                            e.target.value ? new Date(e.target.value) : null
                                        )
                                    }
                                    tabIndex={3}
                                />
                                <Button
                                    icon={mdiInfinity}
                                    color="black"
                                    className={clsx(styles.button)}
                                    onClick={() => token.setValidThrough(null)}
                                />
                            </div>
                        ) : (
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
                        )}
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
            <div className={styles.buttons}>
                {!token.isEditing && (
                    <Button
                        onClick={() => {
                            token.setEditing(true);
                        }}
                        icon={mdiCircleEditOutline}
                        color="orange"
                        title="Bearbeiten"
                    />
                )}
                {token.isEditing && (
                    <>
                        <Button
                            onClick={() => {
                                token.reset();
                                token.setEditing(false);
                            }}
                            icon={mdiCloseCircleOutline}
                            color="black"
                            title="Verwerfen"
                        />
                        <Button
                            icon={mdiContentSave}
                            color="green"
                            title="Speichern"
                            onClick={() => {
                                token.save();
                                token.setEditing(false);
                            }}
                        />
                        <Confirm
                            title="Signup Link löschen"
                            confirmText="Löschen?"
                            icon={mdiDeleteOutline}
                            iconSide="left"
                            color="danger"
                            onConfirm={() => {
                                signupTokenStore.destroy(token);
                            }}
                        />
                    </>
                )}
            </div>
        </div>
    );
});

const SignupLinks = observer(() => {
    const signupTokenStore = useStore('signupTokenStore');

    return (
        <div className={clsx(styles.container)}>
            <Button
                onClick={() => {
                    signupTokenStore.create('', '', null, 0, false).then(
                        action((token) => {
                            token.setEditing(true);
                        })
                    );
                }}
                icon={mdiPlusCircleOutline}
                color="primary"
                text="Registeierungslink erstellen"
            />
            <div className={styles.signupLinks}>
                {_.orderBy(signupTokenStore.signupTokens, ['createdAt', 'id'], ['desc', 'asc']).map(
                    (token) => (
                        <SignupLink key={token.id} token={token} />
                    )
                )}
            </div>
        </div>
    );
});

export default SignupLinks;
