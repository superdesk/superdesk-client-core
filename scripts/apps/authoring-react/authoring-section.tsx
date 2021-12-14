import React from 'react';
import {IFieldsV2} from './data-layer';
import {IArticle} from 'superdesk-api';
import {FieldText} from './fields/field-text';
import {assertNever} from 'core/helpers/typescript-helpers';
import {getField} from 'apps/fields';

interface IProps {
    fields: IFieldsV2;
    item: IArticle;
    readOnly: boolean;
    onChange(itemChanged: IArticle): void;
}

export class AuthoringSection extends React.PureComponent<IProps> {
    render() {
        const {item, fields} = this.props;

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
                                            value={this.props.item[field.id] ?? ''}
                                            onChange={(valueChanged) => {
                                                this.props.onChange({
                                                    ...item,
                                                    [field.id]: valueChanged,
                                                });
                                            }}
                                            readOnly={this.props.readOnly}
                                        />
                                    );
                                } else if (field.type === 'from-extension') {
                                    const FieldType = getField(field.extension_field_type);

                                    return (
                                        <FieldType.editorComponent
                                            item={this.props.item}
                                            value={this.props.item?.extra?.[field.id]}
                                            setValue={(valueChanged) => {
                                                this.props.onChange({
                                                    ...item,
                                                    extra: {
                                                        ...(item.extra ?? {}),
                                                        [field.id]: valueChanged,
                                                    },
                                                });
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
