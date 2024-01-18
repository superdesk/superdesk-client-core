import React from 'react';
import {IVocabulary} from 'superdesk-api';
import {getField} from 'apps/fields';
import {CommonFieldConfiguration} from 'apps/authoring-react/fields/common-field-configuration';
import {SpacerBlock} from 'core/ui/components/Spacer';

export class CustomFieldConfigs extends React.PureComponent<{vocabulary: IVocabulary, onChange(config): void}> {
    render() {
        const field = getField(this.props.vocabulary.custom_field_type);

        if (field == null || field.configComponent == null) {
            return null;
        } else {
            const ConfigComponent = field.configComponent;

            return (
                <div>
                    <CommonFieldConfiguration
                        config={this.props.vocabulary.custom_field_config ?? null}
                        onChange={this.props.onChange}
                    />

                    <SpacerBlock v gap="16" />

                    <ConfigComponent
                        config={this.props.vocabulary.custom_field_config ?? null}
                        onChange={this.props.onChange}
                    />
                </div>
            );
        }
    }
}
