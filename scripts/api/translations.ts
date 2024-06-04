import {IArticle} from 'superdesk-api';
import ng from 'core/services/ng';
import {extensions} from 'appConfig';
import notify from 'core/notify/notify';
import {gettext} from 'core/utils';

function aiTranslationActions(item: IArticle): void {
    if (extensions['ai-widget'].extension.exposes?.overrideTranslations === true) {
        localStorage.setItem(
            'sideWidget',
            JSON.stringify({
                id: 'ai-assistant',
                pinned: true,
                activeSection: 'translations',
            }),
        );
    }

    ng.get('authoringWorkspace').open(item);
    notify.success(gettext('Item Translated'));
}

interface ITranslationsApi {
    aiTranslationActions(item: IArticle): void;
}

export const translations: ITranslationsApi = {
    aiTranslationActions,
};
