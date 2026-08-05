import ng from 'core/services/ng';
import React from 'react';
import {OrderedMap} from 'immutable';
import {
    ITemplate,
    IArticle,
    IAuthoringStorage,
    IAuthoringAutoSave,
    IAuthoringFieldV2,
    IContentProfileV2,
    IFieldsAdapter,
    IFieldsV2,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {AuthoringIntegrationWrapper} from './authoring-integration-wrapper';
import {getArticleContentProfile} from './data-layer';

interface IProps {
    template: ITemplate;
    scopeApply(): void;
}

export class AuthoringAngularTemplateIntegration extends React.PureComponent<IProps> {
    render(): React.ReactNode {
        return (
            <div style={{padding: '1rem', height: '100%'}}>
                <AuthoringIntegrationWrapper
                    itemId={null} // Id doesn't apply when editing embedded JSON.
                    embeddedEntity
                    sidebarMode="hidden"
                    authoringStorage={getTemplateEditViewAuthoringStorage(this.props.template.data as IArticle)}
                    onFieldChange={(_fieldId, fieldsData, computeLatestEntity) => {
                        // Angular aliases this same object as `$scope.item` and edits it in place,
                        // and authoring-react captured it once on mount. Reassigning would leave
                        // both of them pointing at an object nothing writes to any more.
                        Object.assign(this.props.template.data, computeLatestEntity());
                        this.props.scopeApply();

                        return fieldsData;
                    }}
                    autoFocus={false}
                />
            </div>
        );
    }
}

/**
 * Kill/takedown templates can never have a content profile, so there is nothing to derive their
 * fields from. This is the field set the server seeds them with, split into header and content the
 * way angular based authoring places those same fields.
 */
const profilelessTemplateFieldIds: {header: Array<string>; content: Array<string>} = {
    header: ['anpa_take_key', 'ednote'],
    content: ['headline', 'abstract', 'body_html'],
};

function getProfilelessTemplateContentProfile(fieldsAdapter: IFieldsAdapter<IArticle>): IContentProfileV2 {
    const toFields = (fieldIds: Array<string>): IFieldsV2 => fieldIds.reduce(
        (acc, fieldId) => {
            const field = fieldsAdapter[fieldId].getFieldV2({}, {}, () => false);

            // `AuthoringSection` renders each field as `width: <width>%`, so it has to be set here;
            // `getArticleContentProfile` gets it from the content profile's `sdWidth`.
            return acc.set(field.id, {...field, fieldConfig: {width: 100, ...field.fieldConfig}});
        },
        OrderedMap<string, IAuthoringFieldV2>(),
    );

    return {
        id: 'template-without-content-profile',
        name: gettext('Template without a content profile'),
        header: toFields(profilelessTemplateFieldIds.header),
        content: toFields(profilelessTemplateFieldIds.content),
    };
}

function getTemplateEditViewAuthoringStorage(article: IArticle): IAuthoringStorage<IArticle> {
    class AutoSaveTemplate implements IAuthoringAutoSave<IArticle> {
        get() {
            return Promise.resolve(article);
        }

        delete() {
            return Promise.resolve();
        }

        schedule(
            getItem: () => IArticle,
            callback: (autosaved: IArticle) => void,
        ) {
            callback(getItem());
        }

        cancel() {
            // noop
        }

        flush(): Promise<void> {
            return Promise.resolve();
        }
    }

    const authoringStorageTemplateEditView: IAuthoringStorage<IArticle> = {
        autosave: new AutoSaveTemplate(),
        getEntity: () => Promise.resolve(article),
        isLockedInCurrentSession: () => true,
        forceLock: (entity) => Promise.resolve(entity),
        saveEntity: (current) => Promise.resolve(current),
        getContentProfile: (item, fieldsAdapter) => item.profile != null
            ? getArticleContentProfile(item, fieldsAdapter)
            : Promise.resolve(getProfilelessTemplateContentProfile(fieldsAdapter)),
        closeAuthoring: () => null, // no UI button; not possible to close since it's embedded in another view
        getUserPreferences: () => ng.get('preferencesService').get(),
    };

    return authoringStorageTemplateEditView;
}
