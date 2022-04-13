/* eslint-disable react/no-multi-comp */
import React from 'react';
import {IEditorComponentContainerProps, IFieldsV2, IVocabularyItem} from 'superdesk-api';
import {getField} from 'apps/fields';
import {Map} from 'immutable';
import {IToggledFields} from './authoring-react';
import {Switch} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {Spacer} from 'core/ui/components/Spacer';

interface IProps {
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
}

const defaultUserPreferences = {};

export class AuthoringSection extends React.PureComponent<IProps> {
    render() {
        const {fields, fieldsData, toggledFields, toggleField} = this.props;

        return (
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                {
                    fields.map((field) => {
                        const FieldEditorConfig = getField(field.fieldType);
                        const canBeToggled = toggledFields[field.id] != null;
                        const toggledOn = toggledFields[field.id];

                        const toggle = canBeToggled && (
                            <Switch
                                label={gettext('Toggle field')}
                                value={toggledOn}
                                onChange={() => {
                                    toggleField(field.id);
                                }}
                            />
                        );

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
                                            <span className="form-label">
                                                <Spacer h gap="8" noGrow>
                                                    <span>{field.name}</span>
                                                    <span>{toggle}</span>
                                                </Spacer>
                                            </span>

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
                                            <Spacer h gap="8" noGrow>
                                                <span className="field-label--base" >
                                                    {field.name}
                                                </span>

                                                <span>{toggle}</span>
                                            </Spacer>

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

                        const Container = this.props.useHeaderLayout ? HeaderLayout : ContentLayout;

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
                                    onChange={(val) => {
                                        this.props.onChange(field.id, val);
                                    }}
                                    readOnly={this.props.readOnly}
                                    config={field.fieldConfig}
                                    editorPreferences={
                                        this.props.userPreferencesForFields[field.id] ?? defaultUserPreferences
                                    }
                                    onEditorPreferencesChange={(fieldPreferences) => {
                                        this.props.setUserPreferencesForFields({
                                            ...(this.props.userPreferencesForFields ?? {}),
                                            [field.id]: fieldPreferences,
                                        });
                                    }}
                                    getVocabularyItems={this.props.getVocabularyItems}
                                />
                            );
                        }
                    }).toArray()
                }
            </div>
        );
    }
}
