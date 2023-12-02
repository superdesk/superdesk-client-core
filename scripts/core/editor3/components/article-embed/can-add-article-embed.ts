import {IArticle, RICH_FORMATTING_OPTION} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IPropsEditor3Component} from '../Editor3Component';

export function articleEmbedsConfigured(props: IPropsEditor3Component): boolean {
    const embedArticlesFormattingOption: RICH_FORMATTING_OPTION = 'embed articles';

    return props.editorFormat.includes(embedArticlesFormattingOption);
}

export function canAddArticleEmbed(
    embeddingCandidate: IArticle,
    props: IPropsEditor3Component,
): {ok: true} | {ok: false; error: string} {
    if (!articleEmbedsConfigured(props)) {
        return {
            ok: false,
            error: gettext('Embedding articles is not configured for this content profile field'),
        };
    } else if (
        (props?.allowEmbedsFromDesks ?? [])
            .includes(embeddingCandidate?.task?.desk) !== true
    ) {
        return {
            ok: false,
            error: gettext(
                'Content profile field configuration does not allow embedding this item'
                + ' because it is not located in any of permitted desks',
            ),
        };
    } else {
        return {ok: true};
    }
}
