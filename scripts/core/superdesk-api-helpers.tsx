import {IArticle, IAuthoringAction, IContentProfileV2, IExtensionActivationResult} from 'superdesk-api';
import {flatMap} from 'lodash';
import {extensions} from 'appConfig';

export function getArticleActionsFromExtensions(item: IArticle): Array<IAuthoringAction> {
    const actionGetters
        : Array<IExtensionActivationResult['contributions']['entities']['article']['getActions']>
    = flatMap(
        Object.values(extensions),
        (extension) => extension.activationResult.contributions?.entities?.article?.getActions ?? [],
    );

    return flatMap(
        actionGetters.map((getAction) => getAction(item)),
    );
}

export function getAuthoringActionsFromExtensions(
    item: IArticle,
    contentProfile?: IContentProfileV2,
    fieldsData?: Immutable.Map<string, unknown>,
): Array<IAuthoringAction> {
    const actionGetters
        : Array<IExtensionActivationResult['contributions']['getAuthoringActions']>
    = flatMap(
        Object.values(extensions),
        (extension) => extension.activationResult.contributions?.getAuthoringActions ?? [],
    );

    return flatMap(
        actionGetters.map((getPromise) => getPromise(item, contentProfile, fieldsData)),
    );
}
