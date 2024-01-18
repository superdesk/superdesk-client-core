import * as React from 'react';
import {Checkbox} from 'superdesk-ui-framework/react';
import {ICommonFieldConfig} from 'superdesk-api';
import {gettext} from 'core/utils';
import {SpacerBlock} from 'core/ui/components/Spacer';

interface IProps<T> {
    config?: T;
    onChange(config: T): void;
}

export class CommonFieldConfiguration<T extends ICommonFieldConfig> extends React.PureComponent<IProps<T>> {
    render() {
        const config: T = this.props.config ?? {} as T;

        return (
            <React.Fragment>
                <Checkbox
                    label={{text: gettext('Required')}}
                    checked={config.required ?? false}
                    onChange={(val) => {
                        this.props.onChange({...config, required: val});
                    }}
                />

                <SpacerBlock v gap="16" />

                <Checkbox
                    label={{text: gettext('Read-only')}}
                    checked={config?.readOnly ?? false}
                    onChange={(val) => {
                        this.props.onChange({...config, readOnly: val});
                    }}
                />
            </React.Fragment>
        );
    }
}
