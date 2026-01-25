import Admonition from '@theme-original/Admonition';
import CodeBlock from '@theme-original/CodeBlock';
import styles from './styles.module.scss';

const SiteConfig = `
// highlight-next-line
import { brythonCodePluginConfig } from './src/siteConfig/pluginConfigs';
const getSiteConfig: SiteConfigProvider = () => {
    return {
        // ...
        // highlight-next-line
        plugins: [brythonCodePluginConfig],
    }
}`.trim();

const PluginNotRegistered = () => {
    return (
        <Admonition
            type="warning"
            title="Brython plugin not configured."
            className={styles.pluginNotRegistered}
        >
            Configure the Brython Plugin in your <code>siteConfig.ts</code>:
            <CodeBlock title="siteConfig.ts" language="ts">
                {SiteConfig}
            </CodeBlock>
        </Admonition>
    );
};

export default PluginNotRegistered;
