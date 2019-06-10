import React from 'react';
import {get, isEmpty} from 'lodash';

import {getFields} from 'apps/fields';
import {IArticle} from 'superdesk-interfaces/Article';
import {IVocabulary} from 'superdesk-interfaces/Vocabulary';

interface IProps {
    item: IArticle;
    field: IVocabulary;
}

export class PreviewCustomField extends React.PureComponent<IProps> {
    render() {
        const fields = getFields();
        const {item, field} = this.props;
        const FieldType = fields[field.custom_field_type];
        const value = get(item.extra, field._id);

        if (FieldType == null) {
            console.warn('unkwnow custom type', field);
            return null;
        }

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
