import { StorageKey } from '@tdev-stores/utils/Storage';
import useLocalStorage from './useLocalStorage';
import { useColorMode } from '@docusaurus/theme-common';

const AceThemeMap = {
    light: 'xcode',
    dark: 'dracula'
};

const useCodeTheme = () => {
    const { colorMode } = useColorMode();
    const [value, setValue] = useLocalStorage<'light' | 'dark' | 'system'>(
        StorageKey.CodeTheme,
        'system',
        true
    );
    const codeTheme = value ?? 'system';
    return {
        codeTheme: codeTheme,
        setCodeTheme: setValue,
        systemTheme: colorMode,
        colorMode: codeTheme === 'system' ? colorMode : codeTheme,
        aceTheme: codeTheme === 'system' ? AceThemeMap[colorMode] : AceThemeMap[codeTheme]
    } as const;
};

export default useCodeTheme;
