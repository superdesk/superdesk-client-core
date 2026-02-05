import {IArticle, IAuthoringStorage, IExposedFromAuthoring} from 'superdesk-api';

/**
 * Stable refs for toolbar widget components to prevent unnecessary re-renders.
 * These components access the current exposed state via refs that are updated on each render.
 */
export let exposedRef: IExposedFromAuthoring<IArticle> | null = null;
export let authoringStorageRef: IAuthoringStorage<IArticle> | null = null;

export function updateToolbarContext(
    exposed: IExposedFromAuthoring<IArticle> | null,
    authoringStorage: IAuthoringStorage<IArticle> | null,
) {
    exposedRef = exposed;
    authoringStorageRef = authoringStorage;
}
