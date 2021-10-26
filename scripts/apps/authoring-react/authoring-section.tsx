import React from 'react';
import {IFieldsV2} from './data-layer';
import {IArticle} from 'superdesk-api';
import {FieldText} from './fields/field-text';
import {assertNever} from 'core/helpers/typescript-helpers';

interface IProps {
    fields: IFieldsV2;
    item: IArticle;
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
                            <h4>{field.id}</h4>

                            {(() => {
                                const {type} = field;

                                switch (type) {
                                case 'text':
                                    return (
                                        <FieldText
                                            value={this.props.item[field.id]}
                                            onChange={(valueChanged) => {
                                                this.props.onChange({
                                                    ...item,
                                                    [field.id]: valueChanged,
                                                });
                                            }}
                                        />
                                    );

                                case 'dropdown':
                                    return (
                                        <FieldText
                                            value={this.props.item[field.id]}
                                            onChange={(valueChanged) => {
                                                this.props.onChange({
                                                    ...item,
                                                    [field.id]: valueChanged,
                                                });
                                            }}
                                        />
                                    );
                                default:
                                    return assertNever(type);
                                }
                            })()}
                        </div>
                    )).toArray()
                }
            </div>
        );
    }
}
