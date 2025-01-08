import React from 'react';
import {LineInput} from './';
import {KEYCODES} from '../../../contacts/constants';
import {set, get, isEmpty} from 'lodash';
import {gettext} from 'core/utils';
import {IconButton, Input, Option, Select, Spacer, Switch} from 'superdesk-ui-framework/react';

interface IProps {
    remove: () => void,
    field: string,
    value: Record<string, any>,
    label: string,
    onChange: (field: string, value: any) => void,
    readOnly: boolean,
    usages: Array<{ qcode: string }>,
}

interface IState {
    preventSwitch: boolean;
    touched: any;
}

export class ContactNumberInput extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            preventSwitch: false,
            touched: {},
        };

        this.onChange = this.onChange.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.isFieldInvalid = this.isFieldInvalid.bind(this);
    }

    onBlur(e) {
        const _touched = this.state.touched;

        set(_touched, e.target.name, true);

        this.setState({touched: _touched});
    }

    isFieldInvalid(field, value) {
        return get(this.state.touched, field, false) && isEmpty(value);
    }

    onChange(field, value) {
        // Turn off and prevent public switch for confidential contact number
        if (value === 'Confidential') {
            this.props.value.public = false;
            this.setState({preventSwitch: true});
        } else {
            this.setState({preventSwitch: false});
        }

        this.props.onChange(field, value);
    }

    render() {
        const {value, field, remove, onChange, readOnly, usages} = this.props;

        return (
            <Spacer h gap="4" justifyContent="space-between" alignItems="start">
                <Input
                    label={gettext('Number')}
                    value={value.number ?? ''}
                    readonly={readOnly}
                    error={
                        this.isFieldInvalid(`${field}.number`, value.number)
                            ? gettext('This field is required.')
                            : undefined
                    }
                    onChange={(val) => {
                        onChange(`${field}.number`, val);
                    }}
                    type="text"
                    disabled={readOnly}
                />
                <Select
                    onChange={(val) => {
                        this.onChange(`${field}.usage`, val);
                    }}
                    label={gettext('Usage')}
                    value={value.usage ?? ''}
                >
                    <Option value="" />
                    {usages.map((x) => (
                        <Option key={x.qcode}>{x.qcode}</Option>
                    ))}
                </Select>
                <Switch
                    label={{
                        content: gettext('Public'),
                        side: 'left',
                    }}
                    onChange={(val) => {
                        onChange(`${field}.public`, val);
                    }}
                    value={value.public ?? true}
                    disabled={readOnly || this.state.preventSwitch}
                />
                {!readOnly && (
                    <IconButton
                        ariaValue={gettext('Remove')}
                        icon="trash"
                        onClick={remove}
                    />
                )}
            </Spacer>
        );
    }
}
