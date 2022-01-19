import React from 'react';
import {IFieldsV2} from './data-layer';
import {IArticle} from 'superdesk-api';
import {FieldText} from './fields/field-text';
import {assertNever} from 'core/helpers/typescript-helpers';
import {getField} from 'apps/fields';
import {Map} from 'immutable';

interface IProps {
    item: IArticle;
    fieldsData: Map<string, unknown>;
    fields: IFieldsV2;
    readOnly: boolean;
    onChange(fieldId: string, value: unknown): void;
}

export class AuthoringSection extends React.PureComponent<IProps> {
    render() {
        const {fields, fieldsData} = this.props;

        return (
            <div>
                {
                    fields.map((field) => (
                        <div key={field.id}>
                            <h4>{field.name}</h4>

                            {(() => {
                                if (field.type === 'text') {
                                    return (
                                        <FieldText
                                            value={fieldsData[field.id] ?? ''}
                                            onChange={(val) => {
                                                this.props.onChange(field.id, val);
                                            }}
                                            readOnly={this.props.readOnly}
                                        />
                                    );
                                } else if (field.type === 'from-extension') {
                                    const FieldType = getField(field.extension_field_type);

                                    return (
                                        <FieldType.editorComponent
                                            item={this.props.item}
                                            value={fieldsData.get(field.id)}
                                            setValue={(val) => {
                                                this.props.onChange(field.id, val);
                                            }}
                                            readOnly={this.props.readOnly}
                                            config={field.extension_field_config}
                                        />
                                    );
                                } else {
                                    return assertNever(field);
                                }
                            })()}
                        </div>
                    )).toArray()
                }
            </div>
        );
    }
}
