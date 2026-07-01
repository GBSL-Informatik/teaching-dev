import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Rsync from 'rsync';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

type RsyncInstance = InstanceType<typeof Rsync>;

type BaseConfig = {
    ignore: string[];
    open?: boolean;
};

export type NormalizedConfig = BaseConfig & {
    from: string;
    to: string;
};

export type SyncConfig = BaseConfig &
    (
        | {
              from: string;
          }
        | {
              material?: string;
          }
    ) &
    (
        | {
              to: string;
          }
        | {
              section: string;
          }
        | {
              as: string;
          }
    );

export interface ConfigType {
    [key: string]: SyncConfig[];
}

export const CONFIG_NAME = 'material.config.yaml';

const materialConfigPath = path.resolve(REPO_ROOT, CONFIG_NAME);

export const resolveMaterialConfig = (klass: string, config: SyncConfig): NormalizedConfig => {
    let from: string;
    let to: string;
    const destinationBase = klass === 'pages' ? 'src/pages/' : `versioned_docs/version-${klass}/`;
    if ('material' in config && config.material) {
        from = path.join('docs', config.material);
    }
    if ('from' in config && config.from) {
        from = config.from;
    }
    if ('section' in config && config.section) {
        to = path.join(destinationBase, config.section);
    }
    if ('as' in config && config.as) {
        to = path.join(destinationBase, config.as);
    }
    if ('to' in config && config.to) {
        if (config.to.startsWith(destinationBase)) {
            to = config.to;
        } else {
            to = path.join(destinationBase, config.to);
        }
    }

    return { from: from!, to: to!, ignore: config.ignore, open: config.open };
};

export const loadMaterialConfig = (): ConfigType => {
    const source = fs.readFileSync(materialConfigPath, 'utf-8');
    return (yaml.load(source) ?? {}) as ConfigType;
};

export const saveMaterialConfig = (config: ConfigType): void => {
    fs.writeFileSync(
        materialConfigPath,
        yaml.dump(config, {
            noRefs: true,
            lineWidth: -1,
            sortKeys: false
        })
    );
};

export const DOC_PATHS = ['docs/', 'src/pages/', 'blog/'];

export const docBasePath = (src: string): string => {
    return DOC_PATHS.find((p) => src.startsWith(p)) || DOC_PATHS[0];
};
/**
 * Get path relative to doc base path
 */
export const relative2Doc = (p: string): string => {
    const base = docBasePath(p);
    return base ? p.slice(base.length) : p;
};

export const ensureTrailingSlash = (p: string): string => {
    if (typeof p !== 'string') {
        return p;
    }
    if (p.endsWith('/')) {
        return p;
    }
    return `${p}/`;
};

export const ensureStartingSlash = (p: string): string => {
    if (typeof p !== 'string') {
        return p;
    }
    if (p.startsWith('/')) {
        return p;
    }
    return `/${p}`;
};

/**
 * Ensure rsync sync completes successfully, retrying on failure
 */
export const ensureSync = async (rsync: RsyncInstance, srcPath: string): Promise<boolean> => {
    let success = false;
    let attempt = 0;
    while (!success) {
        const rs = new Promise<boolean>((resolve) => {
            rsync.execute((err: Error | null, code: number, cmd: string) => {
                if (!err) {
                    console.log('✅', srcPath, cmd);
                    attempt = 0;
                    resolve(true);
                } else {
                    console.log(`[attempt ${++attempt}]: could not sync ${srcPath} retrying ...`);
                    console.log('   ', cmd);
                    console.log('   ', err);
                    console.log('   ', code);
                    console.log('');
                    resolve(false);
                }
            });
        });
        success = await rs;
    }
    return success;
};

export const pathExists = async (p: string): Promise<boolean> => {
    try {
        await fsp.access(p);
        return true;
    } catch {
        return false;
    }
};
