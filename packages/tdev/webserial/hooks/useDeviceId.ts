import React from 'react';

export const DeviceContext = React.createContext<string | null>(null);

export function useDeviceId(): string {
    const context = React.useContext(DeviceContext);
    if (!context) {
        throw new Error('useDeviceId must be used within a DeviceContext.Provider');
    }
    return context;
}
