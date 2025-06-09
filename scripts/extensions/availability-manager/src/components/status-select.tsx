import * as React from 'react';
import {Spacer, TreeSelect} from 'superdesk-ui-framework/react';
import {availabilityStatuses} from '../constants';
import {superdesk} from '../superdesk';
import {getLabelForStatus, getStylesForStatusDot} from '../utils';

const {gettext} = superdesk.localization;

interface IPropsBase {
    label: {text: string, hidden?: boolean, inline?: boolean};
    allowMultiple?: boolean;
    required?: boolean; // false
    inputWrapper?: React.ComponentProps<typeof TreeSelect>['inputWrapper'];
}

interface IPropsDisallowNotSet extends IPropsBase {
    allowNotSet: false;
    label: {text: string, hidden?: boolean, inline?: boolean};
    value: typeof availabilityStatuses;
    onChange(value: typeof availabilityStatuses): void;

}

interface IPropsAllowNotSet extends IPropsBase {
    allowNotSet: true;
    value: Array<typeof availabilityStatuses[0] | {notSet: boolean}>;
    onChange(value: Array<typeof availabilityStatuses[0] | {notSet: boolean}>): void;
}

type IProps = IPropsDisallowNotSet | IPropsAllowNotSet;

export class StatusSelect extends React.PureComponent<IProps> {
    render() {
        const labelHidden = this.props.label.hidden ?? false;
        const inlineLabel = this.props.label?.inline ?? false;

        const getLabel = (id: IProps['value'][0]): string => {
            if (typeof id === 'string') {
                return getLabelForStatus(id);
            } else {
                return gettext('Not set');
            }
        };

        return (
            <TreeSelect
                kind="synchronous"
                value={this.props.value}
                getOptions={() => {
                    if (this.props.allowNotSet) {
                        return [
                            ...availabilityStatuses.map((id) => ({value: id})),
                            {value: {notSet: true}},
                        ];
                    } else {
                        return availabilityStatuses.map((id) => ({value: id}));
                    }
                }}
                getId={(id) => typeof id === 'string' ? id : 'not-set'}
                getLabel={(id) => getLabel(id)}
                onChange={this.props.onChange}
                optionTemplate={(id) => {
                    return (
                        <Spacer h gap="4" justifyContent="start" noWrap>
                            <div>
                                {typeof id === 'string' && (
                                    <div
                                        style={{
                                            ...getStylesForStatusDot(id),
                                        }}
                                    />
                                )}
                            </div>

                            <div>
                                {getLabel(id)}
                            </div>
                        </Spacer>
                    );
                }}
                fullWidth={true}
                inlineLabel={inlineLabel || labelHidden}
                labelHidden={labelHidden}
                label={this.props.label.text}
                required={this.props.required}
                allowMultiple={this.props.allowMultiple ?? false}
                inputWrapper={this.props.inputWrapper}
                data-test-id="status"
            />
        );
    }
}
