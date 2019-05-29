import React from 'react';
import {get} from 'lodash';

import {fields} from 'apps/fields';
import {IArticle} from 'superdesk-interfaces/Article';
import {IVocabulary} from 'superdesk-interfaces/Vocabulary';

interface IProps {
    item: IArticle;
    field: IVocabulary;
    onChange: (item: Partial<IArticle>, time: number) => any;
    readonly: boolean;
}

export class AuthoringCustomField extends React.PureComponent<IProps> {
    setValue(value) {
        const extra = Object.assign({}, this.props.item.extra);

        extra[this.props.field._id] = value || null;
        this.props.item.extra = extra;

        this.props.item.extra[this.props.field._id] = value;
        this.props.onChange(this.props.item, 0);
    }

    render() {
        const {item, field, readonly} = this.props;
        const FieldType = fields[field.custom_field_type];

        if (FieldType == null) {
            console.warn('unkwnow custom type', field.custom_field_type);
            return null;
        }

        return (
            <div>
                <FieldType.editorComponent
                    item={item}
                    value={get(item.extra, field._id)}
                    setValue={(value) => this.setValue(value)}
                    readOnly={readonly}
                />
            </div>
        );
    }
}
