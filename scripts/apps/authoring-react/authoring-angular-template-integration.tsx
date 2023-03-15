import ng from 'core/services/ng';
import React from 'react';
import {ITemplate, IArticle, IAuthoringStorage, IAuthoringAutoSave} from 'superdesk-api';
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
                    sidebarMode="hidden"
                    hideToolbar={true}
                    authoringStorage={getTemplateEditViewAuthoringStorage(this.props.template.data as IArticle)}
                    onFieldChange={(fieldId, fieldsData, computeLatestEntity) => {
                        this.props.template.data = computeLatestEntity();
                        this.props.scopeApply();

                        return fieldsData;
                    }}
                />
            </div>
        );
    }
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
        getEntity: () => Promise.resolve({saved: article, autosaved: null}),
        isLockedInCurrentSession: () => true,
        forceLock: (entity) => Promise.resolve(entity),
        saveEntity: (current) => Promise.resolve(current),
        getContentProfile: (item, fieldsAdapter) => getArticleContentProfile(item, fieldsAdapter),
        closeAuthoring: () => null, // no UI button; not possible to close since it's embedded in another view
        getUserPreferences: () => ng.get('preferencesService').get(),
    };

    return authoringStorageTemplateEditView;
}
