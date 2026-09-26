import { Config } from '@docusaurus/types';
import { describe, expect, it } from 'vitest';
import { applyTransformers, ConfigTransformers } from '../transformers';

describe('applyTransformers', () => {
    it('appends a key to an empty config', () => {
        const transformers: ConfigTransformers = {
            foo: (_) => 'bar'
        };
        const config: Config = {} as Config;
        const result = applyTransformers(config, transformers);
        expect(result).toEqual({
            foo: 'bar'
        });
    });

    it('appends a nested key to an empty config', () => {
        const transformers: ConfigTransformers = {
            'foo.bar': (_) => 'baz'
        };
        const config: Config = {} as Config;
        const result = applyTransformers(config, transformers);
        expect(result).toEqual({
            foo: {
                bar: 'baz'
            }
        });
    });

    it('replaces a string by converting the current value to upper case', () => {
        const transformers: ConfigTransformers = {
            foo: (current: string) => current.toUpperCase()
        };
        const config: Config = {
            foo: 'bar'
        } as unknown as Config;
        const result = applyTransformers(config, transformers);
        expect(result).toEqual({
            foo: 'BAR'
        });
    });

    it('appends to an array at a nested key', () => {
        const transformers: ConfigTransformers = {
            'foo.bar': (current: string[]) => [...(current || []), 'gamma']
        };
        const config: Config = {
            foo: {
                bar: ['alpha', 'beta']
            }
        } as unknown as Config;
        const result = applyTransformers(config, transformers);
        expect(result).toEqual({
            foo: {
                bar: ['alpha', 'beta', 'gamma']
            }
        });
    });

    it('throws when trying to append a key to a string', () => {
        const transformers: ConfigTransformers = {
            'foo.bar': (_) => 'baz'
        };
        const config: Config = {
            foo: 'value'
        } as unknown as Config;
        expect(() => applyTransformers(config, transformers)).toThrowError();
    });

    it('throws when trying to append a key to an array', () => {
        const transformers: ConfigTransformers = {
            'foo.bar': (_) => 'baz'
        };
        const config: Config = {
            foo: []
        } as unknown as Config;
        expect(() => applyTransformers(config, transformers)).toThrowError();
    });
});
