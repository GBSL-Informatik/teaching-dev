import React from 'react';

export const FullscreenContext = React.createContext<string | null>(null);

export const useFullscreenTargetId = () => {
    const context = React.useContext(FullscreenContext);
    if (!context) {
        throw new Error('useFullscreenTargetId must be used within a FullscreenContext.Provider');
    }
    return context;
};
