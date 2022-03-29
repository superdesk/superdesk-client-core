import {IArticle} from 'superdesk-api';
import {getFieldsAdapter} from './field-adapters';
import {getCustomFieldVocabularies} from 'core/helpers/business-logic';
import {IOldCustomFieldId} from './interfaces';

interface IAuthoringReactArticleAdapter {
    /**
     * Remove changes done for authoring-react
    */
    fromAuthoringReact<T extends Partial<IArticle>>(article: T): T;

    /**
     * Apply changes required for for authoring-react
    */
    toAuthoringReact<T extends Partial<IArticle>>(article: T): T;
}

/**
 * There are slight changes in data structure that AuthoringV2 uses.
 *
 * 1. Fields are generic in AuthoringV2. Field IDs are not used in business logic.
 *  Adapter moves some custom fields to {@link IArticle} root.
 *
 * 2. Angular based authoring adds prefixes fields in {@link IArticle.fields_meta} (only {@link IOldCustomFieldId})
 *  to prevent possible conflicts of field IDs. It seems though, that validation is in place
 *  to prevent duplicate IDs, thus prefixing was never necessary. Adapter removes the prefixes.
 */
export function getArticleAdapter(): Promise<IAuthoringReactArticleAdapter> {
    return getCustomFieldVocabularies().then((customFieldVocabularies) => {
        const fieldsAdapter = getFieldsAdapter(customFieldVocabularies);

        const oldFormatCustomFieldIds: Set<IOldCustomFieldId> = new Set(
            customFieldVocabularies
                .filter((vocabulary) => vocabulary.field_type === 'text')
                .map((vocabulary) => vocabulary._id),
        );

        const rootFieldsToMove =
            Object.keys(fieldsAdapter)
                .filter((fieldId) => oldFormatCustomFieldIds.has(fieldId) !== true);

        const adapter: IAuthoringReactArticleAdapter = {
            fromAuthoringReact: (_article) => {
                // making a copy in order to do immutable updates
                let article = {..._article};

                // move fields to article root (except for fields with a custom adapter)
                if (_article.extra != null) {
                    article.extra = {..._article.extra ?? {}};

                    for (const fieldId of rootFieldsToMove) {
                        const fieldHasCustomAdapter = fieldsAdapter[fieldId]?.saveData != null;

                        if (!fieldHasCustomAdapter && article.extra.hasOwnProperty(fieldId)) {
                            article[fieldId] = article.extra[fieldId];

                            delete article.extra[fieldId];
                        }
                    }
                }

                // run field adapters
                for (const fieldId of Object.keys(fieldsAdapter)) {
                    const fieldAdapter = fieldsAdapter[fieldId];

                    if (fieldAdapter?.saveData != null && (article.extra?.hasOwnProperty(fieldId) ?? false)) {
                        const fieldValue = article.extra[fieldId];

                        delete article.extra[fieldId];

                        article = fieldAdapter.saveData(fieldValue, article);
                    }
                }

                // Add prefixes
                for (const fieldId of Array.from(oldFormatCustomFieldIds)) {
                    const withPrefix = `extra>${fieldId}`;

                    if (article.fields_meta?.hasOwnProperty(fieldId)) {
                        article.fields_meta[withPrefix] = article.fields_meta[fieldId];

                        delete article.fields_meta[fieldId];
                    }
                }

                return article;
            },
            toAuthoringReact: (_article) => {
                let article = {..._article}; // ensure immutability

                if (_article.extra != null) { // ensure immutability
                    article.extra = {..._article.extra};
                }

                if (_article.fields_meta != null) { // ensure immutability
                    article.fields_meta = {..._article.fields_meta};
                }

                // Moving fields from authoring root to extra (except for fields with a custom adapter)
                for (const fieldId of rootFieldsToMove) {
                    const fieldHasCustomAdapter = fieldsAdapter[fieldId]?.getSavedData != null;

                    if (!fieldHasCustomAdapter && article.hasOwnProperty(fieldId)) {
                        if (article.extra == null) {
                            article.extra = {};
                        }

                        article.extra[fieldId] = article[fieldId];
                    }
                }

                // run field adapters
                for (const fieldId of Object.keys(fieldsAdapter)) {
                    const fieldAdapter = fieldsAdapter[fieldId];

                    if (fieldAdapter?.getSavedData != null) {
                        if (article.extra == null) {
                            article.extra = {};
                        }

                        article.extra[fieldId] = fieldAdapter.getSavedData(article);
                    }
                }

                // remove prefixes
                for (const fieldId of Array.from(oldFormatCustomFieldIds)) {
                    const withPrefix = `extra>${fieldId}`;

                    if (article.fields_meta?.hasOwnProperty(withPrefix)) {
                        article.fields_meta[fieldId] = article.fields_meta[withPrefix];

                        delete article.fields_meta[withPrefix];
                    }
                }

                return article;
            },
        };

        return adapter;
    });
}
