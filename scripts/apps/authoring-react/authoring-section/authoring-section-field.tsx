import React from 'react';
import {IAuthoringFieldV2, IAuthoringSectionTheme, IFieldsData} from 'superdesk-api';
import {getField} from 'apps/fields';
import {getFieldContainer} from './get-field-container';
import {IPropsAuthoringSection} from './authoring-section';
import {memoize} from 'core/memoize';

interface IProps<T> {
    field: IAuthoringFieldV2;
    fieldsData: IFieldsData;
    onChange: IPropsAuthoringSection<T>['onChange'];
    readOnly: boolean;
    language: string;
    canBeToggled: boolean;
    toggledOn: boolean;
    toggleField: IPropsAuthoringSection<T>['toggleField'];
    editorPreferences: unknown;
    onEditorPreferencesChange: (fieldId: string, preferences: unknown) => void;
    useHeaderLayout: IPropsAuthoringSection<T>['useHeaderLayout'];
    getVocabularyItems: IPropsAuthoringSection<T>['getVocabularyItems'];
    validationError?: string;
    uiTheme?: IAuthoringSectionTheme;
    item: T;
}

export class AuthoringSectionField<T> extends React.PureComponent<IProps<T>> {
    private getFieldContainer: typeof getFieldContainer;

    constructor(props: IProps<T>) {
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
                    uiTheme={this.props.uiTheme == null ? undefined : {
                        backgroundColor: this.props.uiTheme.backgroundColor,
                        backgroundColorSecondary: this.props.uiTheme.backgroundColorSecondary,
                        textColor: this.props.uiTheme.textColor,
                        fontSize: this.props.uiTheme.fieldTheme[field.id]?.fontSize,
                        fontFamily: this.props.uiTheme.fontFamily,
                    }}
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
                    fieldId={field.id}
                    editorPreferences={this.props.editorPreferences}
                    onEditorPreferencesChange={(fieldPreferences) => {
                        this.props.onEditorPreferencesChange(field.id, fieldPreferences);
                    }}
                    getVocabularyItems={this.props.getVocabularyItems}
                    item={this.props.item}
                />
            );
        }
    }
}
