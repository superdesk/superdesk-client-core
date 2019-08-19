import * as React from 'react';
import {
    IFormGroup,
    IGenericListPageComponent,
    ISuperdesk,
} from 'superdesk-api';
import {IKnowledgeBaseItem} from './interfaces';
import {getFields} from './GetFields';

export function getAnnotationsLibraryPage(superdesk: ISuperdesk) {
    return class AnnotationsLibraryPage extends React.Component {
        render() {
            const {gettext} = superdesk.localization;
            const {
                getGenericListPageComponent,
                ListItem,
                ListItemColumn,
                ListItemActionsMenu,
            } = superdesk.components;
            const {getFormFieldPreviewComponent} = superdesk.forms;

            const AnnotationsLibraryPageComponent = getGenericListPageComponent<IKnowledgeBaseItem>('concept_items');

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

            const renderRow = (
                key: string,
                item: IKnowledgeBaseItem,
                page: IGenericListPageComponent<IKnowledgeBaseItem>,
            ) => (
                <ListItem key={key} onClick={() => page.openPreview(item._id)}>
                    <ListItemColumn>
                        {getFormFieldPreviewComponent(item, nameField)}
                    </ListItemColumn>
                    <ListItemColumn>
                        {getFormFieldPreviewComponent(item, languageField)}
                    </ListItemColumn>
                    <ListItemColumn ellipsisAndGrow noBorder>
                        {getFormFieldPreviewComponent(item, definitionField)}
                    </ListItemColumn>
                    <ListItemActionsMenu>
                        <div style={{display: 'flex'}}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    page.startEditing(item._id);
                                }}
                                title={gettext('Edit')}
                            >
                                <i className="icon-pencil" />
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    page.deleteItem(item);
                                }}
                                title={gettext('Remove')}
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
                    newItemTemplate={{cpnat_type: 'cpnat:abstract'}}
                    fieldForSearch={nameField}
                />
            );
        }
    };
}
