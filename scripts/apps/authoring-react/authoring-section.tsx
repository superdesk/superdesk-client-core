import React from 'react';
import {IFieldsV2} from 'superdesk-api';
import {getField} from 'apps/fields';
import {Map} from 'immutable';

interface IProps {
    language: string;
    fieldsData: Map<string, unknown>;
    fields: IFieldsV2;
    userPreferencesForFields: {[fieldId: string]: unknown};
    setUserPreferencesForFields(userPreferencesForFields: {[fieldId: string]: unknown}): void;
    readOnly: boolean;
    onChange(fieldId: string, value: unknown): void;
}

const defaultUserPreferences = {};

export class AuthoringSection extends React.PureComponent<IProps> {
    render() {
        const {fields, fieldsData} = this.props;

        return (
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                {
                    fields.map((field) => {
                        const FieldEditorConfig = getField(field.fieldType);

                        return (
                            <div key={field.id}>
                                <span className="field-label--base" style={{marginBottom: 20}}>
                                    {field.name}
                                </span>

                                <FieldEditorConfig.editorComponent
                                    editorId={field.id}
                                    language={this.props.language}
                                    value={fieldsData.get(field.id)}
                                    onChange={(val) => {
                                        this.props.onChange(field.id, val);
                                    }}
                                    readOnly={this.props.readOnly}
                                    config={field.fieldConfig}
                                    userPreferences={
                                        this.props.userPreferencesForFields[field.id] ?? defaultUserPreferences
                                    }
                                    onUserPreferencesChange={(fieldPreferences) => {
                                        this.props.setUserPreferencesForFields({
                                            ...(this.props.userPreferencesForFields ?? {}),
                                            [field.id]: fieldPreferences,
                                        });
                                    }}
                                />
                            </div>
                        );
                    }).toArray()
                }
            </div>
        );
    }
}