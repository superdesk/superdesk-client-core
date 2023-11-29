import {IArticle, RICH_FORMATTING_OPTION} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IPropsEditor3Component} from '../Editor3Component';

export function canAddArticleEmbed(
    embeddingCandidate: IArticle,
    props: IPropsEditor3Component,
): {ok: true} | {ok: false; error: string} {
    const embedArticlesFormattingOption: RICH_FORMATTING_OPTION = 'embed articles';

    if (props.editorFormat.includes(embedArticlesFormattingOption) !== true) {
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
