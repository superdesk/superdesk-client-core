import {IValidationResult} from '@superdesk/common';
import * as React from 'react';
import {IShow} from '../../interfaces';

import {superdesk} from '../../superdesk';

const {SelectFromEndpoint} = superdesk.components;

const {gettext} = superdesk.localization;

interface IPropsRequired {
    value: IShow['_id'] | null;
    onChange(val: IShow['_id']): void;
    readOnly?: boolean;
    validationError?: IValidationResult;
    showLabel?: boolean;
    required: true;
}

interface IPropsOptional {
    value: IShow['_id'] | null;
    onChange(val: IShow['_id'] | null): void;
    readOnly?: boolean;
    validationError?: string;
    showLabel?: boolean;
    required: false;
}

type IProps = IPropsRequired | IPropsOptional;

export class SelectShow extends React.PureComponent<IProps> {
    render() {
        return (
            <SelectFromEndpoint
                label={this.props.showLabel !== false ? gettext('Show') : undefined}
                endpoint="/shows"
                sort={[['name', 'asc']]}
                value={this.props.value}
                onChange={(val) => {
                    if (this.props.required === true) {
                        if (val == null) {
                            throw new Error('illegal state, value can not be null when required');
                        }

                        this.props.onChange(val);
                    } else {
                        this.props.onChange(val);
                    }
                }}
                itemTemplate={({entity: show}: {entity: IShow}) => (
                    show == null
                        ? (
                            <span>{gettext('Select show')}</span>
                        ) : (
                            <span>{show.title}</span>
                        )
                )}
                readOnly={this.props.readOnly}
                validationError={this.props.validationError}
                required={this.props.required}
            />
        );
    }
}
