import {RawDraftContentState} from 'draft-js';
import {isEqual} from 'lodash';
import {IArticle, IAuthoringFieldV2, IFieldAdapter, IEditor3Config, IEditor3ValueStorage} from 'superdesk-api';
import {gettext} from 'core/utils';
import {retrieveStoredValueEditor3Generic, storeEditor3ValueBase} from '.';
import {copyEmbeddedArticlesIntoAssociations} from '../copy-embedded-articles-into-associations';
import {editor3ToOperationalFormat} from '../fields/editor3';

const BODY_MEDIA_KEY_PREFIX = 'editor_';

/**
 * Body media is also kept in `associations` as `editor_<entity key>`, which is what publishing outputs. Angular's
 * editor3 rewrites those entries on every body change (`syncAssociations`); the server does it only when a save
 * sends `associations`, so they are rewritten here for an edited body.
 */
export function getAssociationsWithBodyMedia(
    associations: IArticle['associations'],
    rawContentState: RawDraftContentState,
): IArticle['associations'] {
    const result: IArticle['associations'] = {};

    Object.entries(associations ?? {}).forEach(([key, value]) => {
        result[key] = key.startsWith(BODY_MEDIA_KEY_PREFIX) ? null : value;
    });

    Object.entries(rawContentState.entityMap).forEach(([key, entity]) => {
        if (entity.type === 'MEDIA') {
            result[BODY_MEDIA_KEY_PREFIX + key] = entity.data.media;
        }
    });

    return result;
}

function getAssociationsIfBodyChanged(
    item: IArticle,
    rawContentState: RawDraftContentState,
): Pick<IArticle, 'associations'> | {} {
    return isEqual(item.fields_meta?.body_html?.draftjsState?.[0], rawContentState)
        ? {}
        : {associations: getAssociationsWithBodyMedia(item.associations, rawContentState)};
}

export const body_html: IFieldAdapter<IArticle> = {
    getFieldV2: (fieldEditor, fieldSchema) => {
        const fieldConfig: IEditor3Config = {
            editorFormat: fieldEditor.formatOptions ?? [],
            minLength: fieldSchema?.minlength,
            maxLength: fieldSchema?.maxlength,
            maxSoftLength: fieldEditor?.maxSoftLength,
            showFloatingCount: fieldEditor?.showFloatingCount,
            cleanPastedHtml: fieldEditor?.cleanPastedHTML,
            singleLine: false,
            disallowedCharacters: [],
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'body_html',
            name: gettext('Body HTML'),
            fieldType: 'editor3',
            fieldConfig,
        };

        return fieldV2;
    },

    retrieveStoredValue: (item: IArticle, authoringStorage, config: IEditor3Config) =>
        retrieveStoredValueEditor3Generic(
            'body_html',
            item,
            authoringStorage,
            config,
        ),

    storeValue: (value: IEditor3ValueStorage, item, config, preferIncomplete) => {
        if (preferIncomplete) {
            // An autosave reopened later becomes the item a save starts from, so its `associations` have to
            // match its body already: the save below sees that body as unchanged and does not rewrite them.
            return {
                ...item,
                ...getAssociationsIfBodyChanged(item, value.rawContentState),
                fields_meta: {
                    ...(item.fields_meta ?? {}),
                    body_html: {
                        draftjsState: [value.rawContentState],
                    },
                },
            };
        } else {
            const result = storeEditor3ValueBase(
                'body_html',
                item,
                value,
                config,
            );

            const articleUpdated = {
                ...result.article,
                ...getAssociationsIfBodyChanged(item, value.rawContentState),
            };

            articleUpdated.body_html = result.stringValue;

            // Keep compatibility with existing output format.
            // (only applicable to body_html field)
            articleUpdated.annotations = result.annotations;

            const contentState = editor3ToOperationalFormat(value, item.language).contentState;

            copyEmbeddedArticlesIntoAssociations(contentState, articleUpdated);

            return articleUpdated;
        }
    },
};
