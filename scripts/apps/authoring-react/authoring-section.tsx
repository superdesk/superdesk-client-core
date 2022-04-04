/* eslint-disable react/no-multi-comp */
import React from 'react';
import {IEditorComponentContainerProps, IFieldsV2, IVocabularyItem} from 'superdesk-api';
import {getField} from 'apps/fields';
import {Map} from 'immutable';

interface IProps {
    language: string;
    fieldsData: Map<string, unknown>;
    fields: IFieldsV2;
    onChange(fieldId: string, value: unknown): void;
    readOnly: boolean;
    userPreferencesForFields: {[fieldId: string]: unknown};
    useHeaderLayout?: boolean;
    setUserPreferencesForFields(userPreferencesForFields: {[fieldId: string]: unknown}): void;
    getVocabularyItems(vocabularyId: string): Array<IVocabularyItem>;
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

                        class HeaderLayout extends React.PureComponent<IEditorComponentContainerProps> {
                            render() {
                                const {miniToolbar} = this.props;

                                return (
                                    <div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'start',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <div>
                                                <span className="form-label">
                                                    {field.name}
                                                </span>
                                            </div>

                                            <div style={{flexGrow: 1}}>
                                                {this.props.children}

                                                {
                                                    miniToolbar != null && (
                                                        <div>{miniToolbar}</div>
                                                    )
                                                }
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        }

                        class ContentLayout extends React.PureComponent<IEditorComponentContainerProps> {
                            render() {
                                const {miniToolbar} = this.props;

                                return (
                                    <div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: 15,
                                            }}
                                        >
                                            <div>
                                                <span className="field-label--base" >
                                                    {field.name}
                                                </span>
                                            </div>

                                            {
                                                miniToolbar != null && (
                                                    <div>{miniToolbar}</div>
                                                )
                                            }
                                        </div>

                                        {this.props.children}
                                    </div>
                                );
                            }
                        }

                        return (
                            <FieldEditorConfig.editorComponent
                                key={field.id}
                                editorId={field.id}
                                container={this.props.useHeaderLayout ? HeaderLayout : ContentLayout}
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
                                getVocabularyItems={this.props.getVocabularyItems}
                            />
                        );
                    }).toArray()
                }
            </div>
        );
    }
}
