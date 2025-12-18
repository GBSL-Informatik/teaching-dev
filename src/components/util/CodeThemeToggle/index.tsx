import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { mdiBackupRestore, mdiMoonWaxingCrescent, mdiThemeLightDark, mdiWhiteBalanceSunny } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import useCodeTheme from '@tdev-hooks/useCodeTheme';

export const CodeThemeIcon = {
    light: mdiWhiteBalanceSunny,
    dark: mdiMoonWaxingCrescent,
    system: mdiThemeLightDark
};
export const CodeThemeTitle = {
    light: 'Helle Codeblöcke',
    dark: 'Dunkle Codeblöcke',
    system: 'System Theme'
};
export const CodeThemeText = {
    light: 'Hell',
    dark: 'Dunkel',
    system: 'System'
};

interface Props {
    className?: string;
    showText?: boolean;
}

const CodeThemeToggle = (props: Props) => {
    const { codeTheme, setCodeTheme, systemTheme } = useCodeTheme();
    const toggleCodeTheme = React.useCallback(() => {
        setCodeTheme(codeTheme === 'light' ? 'dark' : 'light');
    }, [codeTheme]);
    const systemMode = `(${CodeThemeText[systemTheme]})`;
    const text = codeTheme === 'system' ? `${CodeThemeText.system} ${systemMode}` : CodeThemeText[codeTheme];
    return (
        <div className={clsx(props.className, styles.codeThemeToggleWrapper)}>
            <Button
                text={props.showText ? text : (undefined as any)}
                onClick={toggleCodeTheme}
                icon={CodeThemeIcon[codeTheme]}
                className={clsx(styles.codeThemeToggle)}
                iconSide="left"
                color="primary"
                title={`${CodeThemeTitle[codeTheme]}${codeTheme === 'system' ? ` ${systemMode}` : ''}`}
            />
            {codeTheme !== 'system' && (
                <Button
                    icon={mdiBackupRestore}
                    title={`Code Theme auf Standard zurücksetzen ${systemMode}`}
                    onClick={() => setCodeTheme('system')}
                    className={clsx(styles.resetButton)}
                    color="secondary"
                />
            )}
        </div>
    );
};

export default CodeThemeToggle;
