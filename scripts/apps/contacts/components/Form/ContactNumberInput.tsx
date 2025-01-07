import React from 'react';
import {Row, LineInput, SelectInput, Input, Toggle} from './';
import {KEYCODES} from '../../../contacts/constants';
import {set, get, isEmpty} from 'lodash';
import {gettext} from 'core/utils';
import {Label} from 'superdesk-ui-framework/react';

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
            <Row flex={true}>
                <LineInput
                    readOnly={readOnly}
                    invalid={this.isFieldInvalid(`${field}.number`, value.number)}
                    message={
                        this.isFieldInvalid(`${field}.number`, value.number)
                            ? gettext('This field is required.')
                            : ''
                    }
                >
                    <Label text={gettext('Number')} />
                    <Input
                        value={get(value, 'number', '')}
                        onChange={onChange}
                        type="text"
                        disabled={readOnly}
                    />
                </LineInput>
                <LineInput readOnly={readOnly} className="sd-line-input__usage">
                    <Label text={gettext('usage')} />
                    <SelectInput
                        noMargin={true}
                        field={`${field}.usage`}
                        value={get(value, 'usage', '')}
                        onChange={this.onChange}
                        options={usages}
                        labelField="qcode"
                        keyField="qcode"
                        clearable={true}
                    />

                </LineInput>
                <LineInput readOnly={readOnly} className="sd-line-input__usage-flag">
                    <Label text={gettext('public')} />
                    <Toggle
                        value={get(value, 'public', true)}
                        onChange={(e) => onChange(`${field}.public`, e.target.value)}
                        readOnly={readOnly || this.state.preventSwitch}
                    />
                </LineInput>
                <LineInput readOnly={readOnly}>
                    {!readOnly && (
                        <a
                            tabIndex={0}
                            className="icn-btn sd-line-input__icon"
                            onClick={remove}
                            onKeyDown={(event) => {
                                if (event && event.keyCode === KEYCODES.ENTER) {
                                    event.preventDefault();
                                    remove();
                                }
                            }}
                        >
                            <i className="icon-trash" />
                        </a>
                    )}
                </LineInput>

            </Row>
        );
    }
}
