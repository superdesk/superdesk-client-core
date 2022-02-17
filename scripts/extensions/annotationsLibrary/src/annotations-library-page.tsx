import * as React from 'react';
import {
    IFormGroup,
    IGenericListPageComponent,
    ISuperdesk,
} from 'superdesk-api';
import {IKnowledgeBaseItem, IKnowledgeBaseItemBase} from './interfaces';
import {getFields} from './GetFields';

export function getAnnotationsLibraryPage(superdesk: ISuperdesk) {
    return class AnnotationsLibraryPage extends React.Component {
        render() {
            const {gettext} = superdesk.localization;
            const {
                getGenericHttpEntityListPageComponent,
                ListItem,
                ListItemColumn,
                ListItemActionsMenu,
            } = superdesk.components;
            const {getFormFieldPreviewComponent} = superdesk.forms;

            const {
                nameField,
                languageField,
                definitionField,
            } = getFields(superdesk);

            const formConfig: IFormGroup = {
                direction: 'vertical',
                type: 'inline',
                form: [
                    nameField,
                    languageField,
                    definitionField,
                ],
            };

            const AnnotationsLibraryPageComponent =
                getGenericHttpEntityListPageComponent<IKnowledgeBaseItem>('concept_items', formConfig);

            const renderRow = (
                key: string,
                item: IKnowledgeBaseItem,
                page: IGenericListPageComponent<IKnowledgeBaseItem>,
            ) => (
                <ListItem key={key} onClick={() => page.openPreview(item._id)}>
                    <ListItemColumn bold noBorder>
                        {getFormFieldPreviewComponent(item, nameField)}
                    </ListItemColumn>
                    <ListItemColumn ellipsisAndGrow noBorder>
                        {getFormFieldPreviewComponent(item, definitionField, {showAsPlainText: true})}
                    </ListItemColumn>
                    <ListItemActionsMenu>
                        <div style={{display: 'flex'}}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    page.startEditing(item._id);
                                }}
                                title={gettext('Edit')}
                                aria-label={gettext('Edit')}
                            >
                                <i className="icon-pencil" />
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    page.deleteItem(item);
                                }}
                                title={gettext('Remove')}
                                aria-label={gettext('Remove')}
                            >
                                <i className="icon-trash" />
                            </button>
                        </div>
                    </ListItemActionsMenu>
                </ListItem>
            );

            return (
                <AnnotationsLibraryPageComponent
                    defaultSortOption={{field: 'name', direction: 'ascending'}}
                    formConfig={formConfig}
                    renderRow={renderRow}
                    getNewItemTemplate={(page) => {
                        const baseTemplate: Partial<IKnowledgeBaseItemBase> = {
                            cpnat_type: 'cpnat:abstract',
                        };
                        const filteredLanguage = page.getActiveFilters().language;

                        if (filteredLanguage != null) {
                            return {
                                ...baseTemplate,
                                language: filteredLanguage,
                            };
                        } else if (superdesk.instance.config.default_language != null) {
                            return {
                                ...baseTemplate,
                                language: superdesk.instance.config.default_language,
                            };
                        } else {
                            return baseTemplate;
                        }
                    }}
                    fieldForSearch={nameField}
                    defaultFilters={
                        superdesk.instance.config.default_language == null
                            ? {}
                            : {language: superdesk.instance.config.default_language}
                    }
                    getId={(item) => item._id}
                />
            );
        }
    };
}
