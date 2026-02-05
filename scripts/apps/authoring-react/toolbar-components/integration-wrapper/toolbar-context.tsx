import React, {createContext, useContext} from 'react';
import {IAuthoringStorage, IExposedFromAuthoring} from 'superdesk-api';

/**
 * React Context for toolbar widget components.
 * Using React Context instead of module-level mutable state ensures that
 * each authoring instance maintains its own context, preventing bugs when
 * multiple AuthoringIntegrationWrapper components are rendered simultaneously
 * (e.g., in MultiEditModal).
 */
export interface IToolbarContext<T> {
    exposed: IExposedFromAuthoring<T> | null;
    authoringStorage: IAuthoringStorage<T> | null;
}

const defaultContextValue: IToolbarContext<unknown> = {
    exposed: null,
    authoringStorage: null,
};

// Using `unknown` as the default type parameter since context consumers will cast as needed
export const ToolbarContext = createContext<IToolbarContext<unknown>>(defaultContextValue);

/**
 * Hook to access the toolbar context.
 * Must be used within a component wrapped by ToolbarContextProvider.
 */
export function useToolbarContext<T>(): IToolbarContext<T> {
    return useContext(ToolbarContext) as IToolbarContext<T>;
}

interface IToolbarContextProviderProps<T> {
    exposed: IExposedFromAuthoring<T> | null;
    authoringStorage: IAuthoringStorage<T> | null;
    children: React.ReactNode;
}

/**
 * Provider component that supplies toolbar context to its children.
 */
export function ToolbarContextProvider<T>({
    exposed,
    authoringStorage,
    children,
}: IToolbarContextProviderProps<T>): React.ReactElement {
    const value: IToolbarContext<T> = {
        exposed,
        authoringStorage,
    };

    return (
        <ToolbarContext.Provider value={value as IToolbarContext<unknown>}>
            {children}
        </ToolbarContext.Provider>
    );
}
