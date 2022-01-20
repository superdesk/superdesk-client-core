import React from 'react';
import {IFieldsV2} from './data-layer';
import {IArticle} from 'superdesk-api';
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
                    fields.map((field) => {
                        const FieldEditorConfig = getField(field.fieldType);

                        return (
                            <div key={field.id}>
                                <h4>{field.name}</h4>

                                <FieldEditorConfig.editorComponent
                                    item={this.props.item}
                                    value={fieldsData.get(field.id)}
                                    setValue={(val) => {
                                        this.props.onChange(field.id, val);
                                    }}
                                    readOnly={this.props.readOnly}
                                    config={field.fieldConfig}
                                />
                            </div>
                        );
                    }).toArray()
                }
            </div>
        );
    }
}
