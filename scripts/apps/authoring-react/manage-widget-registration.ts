import {registerInternalExtension} from 'core/helpers/register-internal-extension';
// import {getDemoWidget} from './widgets/demo-widget';
import {getFindAndReplaceWidget} from './article-widgets/find-and-replace';
import {getInlineCommentsWidget} from './article-widgets/inline-comments';
import {getCommentsWidget} from './article-widgets/comments';
import {IExtensionActivationResult} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {getSuggestionsWidget} from './article-widgets/suggestions';
import {getVersionsAndItemHistoryWidget} from './article-widgets/versions-and-item-history';
import {getTranslationsWidget} from './article-widgets/translations/translations';
import {getMacrosWidget} from './macros/macros';
import {getPackagesWidget} from './packages';
import {getMetadataWidget} from './article-widgets/metadata/metadata';
import {getRelatedItemsWidget} from './article-widgets/related-items/related-items';

export const authoringReactWidgetsExtension = 'authoring-react-widgets';

export function registerAuthoringReactWidgets() {
    // related items and translations are both order 7, in authoring-angular too. The sort is
    // stable, so the position here is the tie breaker; keep the list in rail order.
    const sidebarWidgets: IExtensionActivationResult['contributions']['authoringSideWidgets'] = [
        getMetadataWidget(),
        getFindAndReplaceWidget(),
        getCommentsWidget(),
        getVersionsAndItemHistoryWidget(),
        getPackagesWidget(),
        getMacrosWidget(),
        getRelatedItemsWidget(),
        getTranslationsWidget(),
    ];

    if ((appConfig.features.editorInlineComments ?? true) === true) {
        sidebarWidgets.push(getInlineCommentsWidget());
    }

    if ((appConfig.features.editorSuggestions ?? true) === true) {
        sidebarWidgets.push(getSuggestionsWidget());
    }

    registerInternalExtension(authoringReactWidgetsExtension, {
        contributions: {
            authoringSideWidgets: sidebarWidgets,
        },
    });
}

/**
 * It could also be unregistered while the app is running,
 * but not when authoring is open.
 */
// export function unregisterAuthoringReactWidgets() {
//     unregisterInternalExtension(authoringReactWidgetsExtension);
// }
