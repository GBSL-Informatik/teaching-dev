import type { PluginModule } from '@docusaurus/types';
import type { RuleSetRule, RuleSetUseItem } from 'webpack';

const SWC_LOADER = 'builtin:swc-loader';

/**
 * Enables the 2022-03 decorators (used by MobX) for the swc loader created by Docusaurus.
 * Docusaurus v4 ignores `siteConfig.webpack.jsLoader` when Rspack is used, thus
 * the loader options of the final config are patched instead.
 */
const swcDecorators: PluginModule = () => {
    return {
        name: 'swc-decorators',
        configureWebpack(config) {
            const rules = (config.module?.rules ?? []) as RuleSetRule[];
            rules.forEach(enableDecorators);
            return {};
        }
    };
};

const enableDecorators = (rule: RuleSetRule) => {
    rule.oneOf?.forEach((nested) => nested && enableDecorators(nested as RuleSetRule));
    rule.rules?.forEach((nested) => nested && enableDecorators(nested as RuleSetRule));
    if (!Array.isArray(rule.use)) {
        return;
    }
    rule.use.filter(isSwcLoader).forEach((loader) => {
        const options = loader.options;
        options.jsc.parser.decorators = true;
        options.jsc.transform.decoratorVersion = '2022-03';
    });
};

type Falsy = false | 0 | '' | null | undefined;

interface SwcLoader {
    loader: typeof SWC_LOADER;
    options: { jsc: { parser: Record<string, unknown>; transform: Record<string, unknown> } };
}

const isSwcLoader = (use: RuleSetUseItem | Falsy): use is SwcLoader => {
    return !!use && typeof use === 'object' && use.loader === SWC_LOADER;
};

export default swcDecorators;
