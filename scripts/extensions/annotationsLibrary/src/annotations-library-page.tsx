import * as React from 'react';
import {
    IPageComponentProps,
    IBaseRestApiResponse,
    IFormField,
    IFormGroup,
    IGenericListPageComponent
} from 'superdesk-api';

interface IKnowledgeBaseItem extends IBaseRestApiResponse {
    name: string;
    labels?: Array<string>;
    language: string;
    definition_text: string;
    definition_html: string;

    // http://cv.iptc.org/newscodes/cpnature/
    cpnat_type: 'cpnat:abstract' | 'cpnat:event' | 'cpnat:geoArea'
        | 'cpnat:object' | 'cpnat:organisation' | 'cpnat:person' | 'cpnat:poi';
}

export class AnnotationsLibraryPage extends React.Component<IPageComponentProps> {
    render() {
        const {gettext} = this.props.superdesk.localization;
        const {
            getGenericListPageComponent,
            getFormFieldPreviewComponent,
            ListItem,
            ListItemColumn,
            ListItemActionsMenu,
            FormFieldType,
        } = this.props.superdesk.helpers;
        const AnnotationsLibraryPageComponent = getGenericListPageComponent<IKnowledgeBaseItem>('concept_items');

        const nameField: IFormField = {
            label : gettext('Name'),
            type: FormFieldType.textSingleLine,
            field: 'name',
            required: true,
        };
        const languageField: IFormField = {
            label : gettext('Language'),
            type: FormFieldType.vocabularySingleValue,
            field: 'language',
            component_parameters: {
                vocabulary_id: 'languages',
            },
            required: true,
        };
        const definitionField: IFormField = {
            label : gettext('Definition'),
            type: FormFieldType.textEditor3,
            field: 'definition_html',
            required: true,
        };

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
