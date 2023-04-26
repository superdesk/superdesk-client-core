import React from 'react';
import {IFieldsV2, IVocabularyItem} from 'superdesk-api';
import {Map} from 'immutable';
import {IAuthoringValidationErrors, IToggledFields} from '../authoring-react';
import {AuthoringSectionField} from './authoring-section-field';

export interface IAuthoringSectionTheme {
    backgroundColor: string;

    // used in placed where we need to differetiate some ui components from background for example toolbars
    backgroundColorSecondary: string;

    textColor: string;
    fontFamily: string;

    fieldTheme: {
        [fieldId: string]: {
            fontSize: string | undefined;
        };
    };
}

export interface IPropsAuthoringSection<T> {
    language: string;
    fieldsData: Map<string, unknown>;
    fields: IFieldsV2;
    onChange(fieldId: string, value: unknown): void;
    readOnly: boolean;
    userPreferencesForFields: {[fieldId: string]: unknown};
    useHeaderLayout?: boolean;
    toggledFields: IToggledFields;
    toggleField(fieldId: string): void;
    setUserPreferencesForFields(userPreferencesForFields: {[fieldId: string]: unknown}): void;
    getVocabularyItems(vocabularyId: string): Array<IVocabularyItem>;
    validationErrors: IAuthoringValidationErrors;
    padding?: string | number;
    uiTheme?: IAuthoringSectionTheme;
    item: T;
}

/**
 * A variable is needed in order to use the same object reference
 * and allow PureComponent to skip re-renders.
 */
const defaultUserPreferences = {};

export class AuthoringSection<T> extends React.PureComponent<IPropsAuthoringSection<T>> {
    constructor(props: IPropsAuthoringSection<T>) {
        super(props);

        this.onEditorPreferencesChange = this.onEditorPreferencesChange.bind(this);
    }

    onEditorPreferencesChange(fieldId: string, preferences: unknown) {
        this.props.setUserPreferencesForFields({
            ...(this.props.userPreferencesForFields ?? {}),
            [fieldId]: preferences,
        });
    }

    render() {
        const {toggledFields} = this.props;
        const themeApplies: boolean
            = this.props.fields.find((field) => this.props.uiTheme?.fieldTheme[field.id] != null) != null;

        return (
            <div
                style={{
                    backgroundColor: themeApplies ? this.props.uiTheme.backgroundColor : undefined,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    padding: this.props.padding,
                }}
            >
                {
                    this.props.fields.map((field) => {
                        const canBeToggled = toggledFields[field.id] != null;
                        const toggledOn = toggledFields[field.id];

                        return (
                            <AuthoringSectionField
                                uiTheme={themeApplies ? this.props.uiTheme : undefined}
                                key={field.id}
                                field={field}
                                fieldsData={this.props.fieldsData}
                                onChange={this.props.onChange}
                                readOnly={this.props.readOnly}
                                language={this.props.language}
                                canBeToggled={canBeToggled}
                                toggledOn={toggledOn}
                                toggleField={this.props.toggleField}
                                editorPreferences={
                                    this.props.userPreferencesForFields[field.id] ?? defaultUserPreferences
                                }
                                onEditorPreferencesChange={this.onEditorPreferencesChange}
                                useHeaderLayout={this.props.useHeaderLayout}
                                getVocabularyItems={this.props.getVocabularyItems}
                                validationError={this.props.validationErrors[field.id]}
                                item={this.props.item}
                            />
                        );
                    }).toArray()
                }
            </div>
        );
    }
}
