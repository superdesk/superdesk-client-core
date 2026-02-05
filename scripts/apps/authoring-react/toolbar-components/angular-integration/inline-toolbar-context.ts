import {IArticle, IExposedFromAuthoring} from 'superdesk-api';

/**
 * Stable refs for inline toolbar widget components to prevent unnecessary re-renders.
 * These components access the current exposed state via context that's updated on each render.
 */
export interface IInlineToolbarContext {
    exposed: IExposedFromAuthoring<IArticle> | null;
    setFullWidth: (() => void) | null;
    fullWidth: boolean;
}

export const inlineToolbarContext: IInlineToolbarContext = {
    exposed: null,
    setFullWidth: null,
    fullWidth: false,
};

export function updateInlineToolbarContext(
    exposed: IExposedFromAuthoring<IArticle> | null,
    setFullWidth: (() => void) | null,
    fullWidth: boolean,
) {
    inlineToolbarContext.exposed = exposed;
    inlineToolbarContext.setFullWidth = setFullWidth;
    inlineToolbarContext.fullWidth = fullWidth;
}
