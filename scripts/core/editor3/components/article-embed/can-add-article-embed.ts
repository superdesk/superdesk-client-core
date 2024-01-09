import {IArticle, RICH_FORMATTING_OPTION} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IPropsEditor3Component} from '../Editor3Component';
import {sdApi} from 'api';

export function articleEmbedsConfigured(props: IPropsEditor3Component): boolean {
    const embedArticlesFormattingOption: RICH_FORMATTING_OPTION = 'embed articles';

    return props.editorFormat.includes(embedArticlesFormattingOption);
}

/**
 * source item is to be embedded into destination item
 */
export function canAddArticleEmbed(
    srcId: IArticle['_id'],
    destId: IArticle['_id'],
): Promise<{ok: true; src: IArticle} | {ok: false; error: string}> {
    return Promise.all([
        sdApi.article.get(srcId),
        sdApi.article.get(destId),
    ]).then(([src, dest]) => {
        return Promise.all([
            sdApi.contentProfiles.get(src.profile),
            sdApi.contentProfiles.get(dest.profile),
        ]).then(([srcProfile, destProfile]) => {
            if (srcProfile.embeddable !== true) {
                return {
                    ok: false,
                    error: gettext('Item content profile is not configured to allow embedding.'),
                };
            } else if (srcProfile.embeddable === true && destProfile.embeddable === true) {
                return {
                    ok: false,
                    error: gettext('Can not embed to item which itself can be embedded.'),
                };
            } else {
                return {
                    ok: true,
                    src,
                };
            }
        });
    });
}
