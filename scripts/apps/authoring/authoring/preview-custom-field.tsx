import React from 'react';
import {get, isEmpty} from 'lodash';

import {getField} from 'apps/fields';
import {IArticle, IArticleField} from 'superdesk-api';

interface IProps {
    item: IArticle;
    field: IArticleField;
}

export class PreviewCustomField extends React.PureComponent<IProps> {
    render() {
        const {item, field} = this.props;
        const value = get(item.extra, field._id);
        const FieldType = getField(field.custom_field_type);

        if (FieldType == null || isEmpty(value)) {
            return null;
        }

        return (
            <div>
                <FieldType.previewComponent item={item} value={get(item.extra, field._id)} />
            </div>
        );
    }
}
