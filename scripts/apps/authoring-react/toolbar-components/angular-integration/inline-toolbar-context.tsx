import React, {createContext, useContext} from 'react';
import {IExposedFromAuthoring} from 'superdesk-api';

/**
 * React Context for inline toolbar widget components.
 * Using React Context instead of module-level mutable state ensures that
 * each authoring instance maintains its own context, preventing bugs when
 * multiple AuthoringIntegrationWrapper components are rendered simultaneously
 * (e.g., in MultiEditModal).
 */
export interface IInlineToolbarContext<T> {
    exposed: IExposedFromAuthoring<T> | null;
    setFullWidth: (() => void) | null;
    fullWidth: boolean;
}

const defaultContextValue: IInlineToolbarContext<unknown> = {
    exposed: null,
    setFullWidth: null,
    fullWidth: false,
};

// Using `unknown` as the default type parameter since context consumers will cast as needed
export const InlineToolbarContext = createContext<IInlineToolbarContext<unknown>>(defaultContextValue);

/**
 * Hook to access the inline toolbar context.
 * Must be used within a component wrapped by InlineToolbarContextProvider.
 */
export function useInlineToolbarContext<T>(): IInlineToolbarContext<T> {
    return useContext(InlineToolbarContext) as IInlineToolbarContext<T>;
}

interface IInlineToolbarContextProviderProps<T> {
    exposed: IExposedFromAuthoring<T> | null;
    setFullWidth: (() => void) | null;
    fullWidth: boolean;
    children: React.ReactNode;
}

/**
 * Provider component that supplies inline toolbar context to its children.
 */
export function InlineToolbarContextProvider<T>({
    exposed,
    setFullWidth,
    fullWidth,
    children,
}: IInlineToolbarContextProviderProps<T>): React.ReactElement {
    const value: IInlineToolbarContext<T> = {
        exposed,
        setFullWidth,
        fullWidth,
    };

    return (
        <InlineToolbarContext.Provider value={value as IInlineToolbarContext<unknown>}>
            {children}
        </InlineToolbarContext.Provider>
    );
}
