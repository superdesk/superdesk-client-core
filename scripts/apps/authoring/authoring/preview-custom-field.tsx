import React from 'react';
import {get, isEmpty} from 'lodash';

import {getField} from 'apps/fields';
import {appConfig} from 'appConfig';
import {getLabelForFieldId} from 'apps/workspace/helpers/getLabelForFieldId';
import {FormLabel} from 'superdesk-ui-framework/react';
import {IArticle, IVocabulary} from 'superdesk-api';

interface IProps {
    item: IArticle;
    field: IVocabulary;
}

export class PreviewCustomField extends React.PureComponent<IProps> {
    render() {
        const {item, field} = this.props;
        const value = get(item.extra, field._id);
        const FieldType = getField(field.custom_field_type);
        const label = getLabelForFieldId(field._id, [field]);

        if (FieldType == null || (typeof value !== 'boolean' && isEmpty(value))) {
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
                    config={field.custom_field_config}
                />
            </div>
        );
    }
}
