import React from 'react';
import {IVocabulary} from 'superdesk-api';
import {getField} from 'apps/fields';

export class CustomFieldConfigs extends React.PureComponent<{vocabulary: IVocabulary, onChange(config): void}> {
    render() {
        const field = getField(this.props.vocabulary.custom_field_type);

        if (field == null || field.configComponent == null) {
            return null;
        } else {
            const ConfigComponent = field.configComponent;

            return (
                <ConfigComponent
                    config={this.props.vocabulary.custom_field_config ?? null}
                    onChange={this.props.onChange}
                />
            );
        }
    }
}
