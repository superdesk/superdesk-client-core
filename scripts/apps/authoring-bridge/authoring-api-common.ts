import {IArticle} from 'superdesk-api';
import {runBeforeUpdateMiddlware, runAfterUpdateEvent} from 'apps/authoring/authoring/services/AuthoringService';

export interface IAuthoringApiCommon {
    saveBefore(current: IArticle, original: IArticle): Promise<IArticle>;
    saveAfter(current: IArticle, original: IArticle): void;
}

/**
 * Immutable API that is used in both - angularjs and reactjs based authoring code.
 */
export const authoringApiCommon: IAuthoringApiCommon = {
    saveBefore: (current, original) => {
        return runBeforeUpdateMiddlware(current, original);
    },
    saveAfter: (current, original) => {
        runAfterUpdateEvent(original, current);
    },
};
