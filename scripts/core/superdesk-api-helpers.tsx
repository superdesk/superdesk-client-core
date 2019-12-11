import {IArticle, IArticleAction, IExtensionActivationResult} from "superdesk-api";
import {flatMap} from "lodash";
import {extensions} from "appConfig";

export function getActionsFromExtensions(item: IArticle): Promise<Array<IArticleAction>> {
    const actionGetters
        : Array<IExtensionActivationResult['contributions']['entities']['article']['getActions']>
    = flatMap(
        Object.values(extensions),
        (extension) => extension.activationResult.contributions?.entities?.article?.getActions ?? [],
    );

    return Promise.all(actionGetters.map((getPromise) => getPromise(item)))
        .then((res) => {
            return flatMap(res);
        });
}
