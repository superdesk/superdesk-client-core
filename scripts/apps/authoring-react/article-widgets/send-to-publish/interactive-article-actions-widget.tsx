import {IArticleSideWidget, IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {
    SendToPublishWidget,
    INTERACTIVE_ARTICLE_ACTIONS_WIDGET_ID,
} from './send-to-publish-widget';
import {sdApi} from 'api';

export function getInteractiveArticleActionsWidget(): IArticleSideWidget {
    const widget: IArticleSideWidget = {
        _id: INTERACTIVE_ARTICLE_ACTIONS_WIDGET_ID,
        label: gettext('Send to / Publish'),
        order: 1,
        icon: 'send-to',
        buttonType: 'highlight',
        component: SendToPublishWidget,
        isAllowed: (article: IArticle) => {
            // Only show for articles that can be sent/published
            // Not for archived, killed, or recalled items
            if (['killed', 'recalled'].includes(article.state)) {
                return false;
            }

            // Check if the article can be published or at least sent
            const canPublish = sdApi.article.canPublish(article);
            const canSend = article._type !== 'archived';

            return canPublish || canSend;
        },
    };

    return widget;
}
