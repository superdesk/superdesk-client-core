import * as React from 'react';
import {
    IPageComponentProps,
    IFormGroup,
    IGenericListPageComponent
} from 'superdesk-api';
import {IKnowledgeBaseItem} from './interfaces';
import {getFields} from './GetFields';

export class AnnotationsLibraryPage extends React.Component<IPageComponentProps> {
    render() {
        const {gettext} = this.props.superdesk.localization;
        const {
            getGenericListPageComponent,
            getFormFieldPreviewComponent,
            ListItem,
            ListItemColumn,
            ListItemActionsMenu,
        } = this.props.superdesk.helpers;
        const AnnotationsLibraryPageComponent = getGenericListPageComponent<IKnowledgeBaseItem>('concept_items');

        const {
            nameField,
            languageField,
            definitionField,
        } = getFields(this.props.superdesk);

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
        ) => {
            return (
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
                                onClick={(e) =>  {
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
        };

        return (
            <AnnotationsLibraryPageComponent
                formConfig={formConfig}
                renderRow={renderRow}
                newItemTemplate={{cpnat_type: 'cpnat:abstract'}}
            />
        );
    }
}
