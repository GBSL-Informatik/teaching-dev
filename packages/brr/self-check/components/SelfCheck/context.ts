import React from 'react';

interface SelfCheckContextType {
    solutionId: string;
    taskStateId: string;
}

export const SelfCheckContext = React.createContext<SelfCheckContextType | undefined>(undefined);
