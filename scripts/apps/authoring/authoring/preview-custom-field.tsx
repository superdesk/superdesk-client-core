import React from 'react';
import {get, isEmpty} from 'lodash';

import {fields} from 'apps/fields';
import {IArticle} from 'superdesk-interfaces/Article';
import {IVocabulary} from 'superdesk-interfaces/Vocabulary';

interface IProps {
    item: IArticle;
    field: IVocabulary;
}

export class PreviewCustomField extends React.PureComponent<IProps> {
    render() {
        const {item, field} = this.props;

        const FieldType = fields.fields[field.custom_field_type];

        if (FieldType == null) {
            console.warn('unkwnow custom type', field.custom_field_type);
            return null;
        }

        const value = get(item.extra, field._id);

        if (isEmpty(value)) {
            return null;
        }

        return (
            <div>
                <FieldType.previewComponent item={item} value={get(item.extra, field._id)} />
            </div>
        );
    }
}
