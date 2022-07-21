import React from 'react';
import {IAuthoringFieldV2, IFieldsData} from 'superdesk-api';
import {getField} from 'apps/fields';
import {getFieldContainer} from './get-field-container';
import {IPropsAuthoringSection} from './authoring-section';
import {memoize} from 'core/memoize';

interface IProps {
    field: IAuthoringFieldV2;
    fieldsData: IFieldsData;
    onChange: IPropsAuthoringSection['onChange'];
    readOnly: boolean;
    language: string;
    canBeToggled: boolean;
    toggledOn: boolean;
    toggleField: IPropsAuthoringSection['toggleField'];
    editorPreferences: unknown;
    onEditorPreferencesChange: (fieldId: string, preferences: unknown) => void;
    useHeaderLayout: IPropsAuthoringSection['useHeaderLayout'];
    getVocabularyItems: IPropsAuthoringSection['getVocabularyItems'];
    validationError?: string;
}

export class AuthoringSectionField extends React.PureComponent<IProps> {
    private getFieldContainer: typeof getFieldContainer;

    constructor(props: IProps) {
        super(props);

        this.getFieldContainer = memoize(getFieldContainer, 1);
    }

    render() {
        const {field, fieldsData, canBeToggled, toggledOn} = this.props;
        const FieldEditorConfig = getField(field.fieldType);

        const Container = this.getFieldContainer(
            this.props.useHeaderLayout,
            canBeToggled,
            field,
            toggledOn,
            this.props.toggleField,
            this.props.validationError,
        );

        if (canBeToggled && toggledOn === false) {
            return (
                <Container key={field.id} />
            );
        } else {
            return (
                <FieldEditorConfig.editorComponent
                    key={field.id}
                    editorId={field.id}
                    container={Container}
                    language={this.props.language}
                    value={fieldsData.get(field.id)}
                    fieldsData={fieldsData}
                    onChange={(val) => {
                        this.props.onChange(field.id, val);
                    }}
                    readOnly={this.props.readOnly}
                    config={field.fieldConfig}
                    editorPreferences={this.props.editorPreferences}
                    onEditorPreferencesChange={(fieldPreferences) => {
                        this.props.onEditorPreferencesChange(field.id, fieldPreferences);
                    }}
                    getVocabularyItems={this.props.getVocabularyItems}
                />
            );
        }
    }
}
