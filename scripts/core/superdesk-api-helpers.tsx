import {IArticle, IAuthoringAction, IExtensionActivationResult} from 'superdesk-api';
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
