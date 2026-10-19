import { computed } from 'mobx';
import { type DependencyList, useMemo } from 'react';

/**
 * Read a derived value inside an observer without subscribing its render to
 * every observable used by the derivation. Include captured props and store
 * references in dependencies; MobX tracks observable changes itself.
 */
export const useComputed = <T>(derive: () => T, dependencies: DependencyList): T => {
    const value = useMemo(() => computed(derive), dependencies);
    return value.get();
};
