import React from 'react';
import {get, isEmpty} from 'lodash';

import {getField} from 'apps/fields';
import {IArticle, IArticleField} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {getLabelForFieldId} from 'apps/workspace/helpers/getLabelForFieldId';
import {FormLabel} from 'superdesk-ui-framework/react';

interface IProps {
    item: IArticle;
    field: IArticleField;
}

export class PreviewCustomField extends React.PureComponent<IProps> {
    render() {
        const {item, field} = this.props;
        const value = get(item.extra, field._id);
        const FieldType = getField(field.custom_field_type);
        const label = getLabelForFieldId(field._id, [field]);

        if (FieldType == null || isEmpty(value)) {
            return null;
        }

        return (
            <div>
                {appConfig?.authoring?.preview?.hideContentLabels === true || isEmpty(label) ? null : (
                    <FormLabel text={label} />
                )}
                <FieldType.previewComponent
                    item={item}
                    value={value}
                />
            </div>
        );
    }
}
