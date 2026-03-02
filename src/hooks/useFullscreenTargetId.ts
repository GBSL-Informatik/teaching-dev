import React from 'react';

export const FullscreenContext = React.createContext<string | null>(null);

export function useFullscreenTargetId(ignore: true): null;
export function useFullscreenTargetId(ignore?: false): string;
export function useFullscreenTargetId(ignore?: boolean): string | null;
export function useFullscreenTargetId(ignore?: boolean): string | null {
    if (ignore) {
        return null;
    }
    const context = React.useContext(FullscreenContext);
    if (!context) {
        throw new Error('useFullscreenTargetId must be used within a FullscreenContext.Provider');
    }
    return context;
}
