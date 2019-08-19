import React from 'react';
import {get} from 'lodash';

import {getField} from 'apps/fields';
import {IArticle} from 'superdesk-api';
import {IVocabulary} from 'superdesk-interfaces/Vocabulary';

interface IProps {
    item: IArticle;
    field: IVocabulary;
    editable: boolean;
    onChange: (field: IVocabulary, value: any) => any;
}

export class AuthoringCustomField extends React.PureComponent<IProps> {
    setValue(value) {
        this.props.onChange(this.props.field, value);
    }

    render() {
        const {item, field, editable} = this.props;
        const FieldType = getField(field.custom_field_type);

        if (FieldType == null) {
            return null;
        }

        return (
            <div>
                <FieldType.editorComponent
                    item={item}
                    value={get(item.extra, field._id)}
                    setValue={(value) => this.setValue(value)}
                    readOnly={!editable}
                />
            </div>
        );
    }
}
