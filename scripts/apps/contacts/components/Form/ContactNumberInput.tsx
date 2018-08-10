import React from 'react';
import PropTypes from 'prop-types';
import {Row, LineInput, Input, SelectInput, Toggle, Label} from './';
import {KEYCODES} from '../../../contacts/constants';
import {gettext} from '../../../contacts/helpers';
import {set, get, isEmpty} from 'lodash';

export class ContactNumberInput extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

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
        let _touched = this.state.touched;

        set(_touched, e.target.name, true);

        this.setState({touched: _touched});
    }

    isFieldInvalid(field, value) {
        return get(this.state.touched, field, false) && isEmpty(value);
    }

    onChange(field, value) {
        // Turn off and prevent public switch for confidential contact number
        if (value === 'Confidential') {
            this.props.value['public'] = false;
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
                <LineInput readOnly={readOnly}
                    invalid={this.isFieldInvalid(`${field}.number`, value['number'])}
                    message={this.isFieldInvalid(`${field}.number`, value['number']) ?
                        gettext('This field is required.') : ''}>
                    <Label text={gettext('Number')} />
                    <Input
                        field={`${field}.number`}
                        value={get(value, 'number', '')}
                        onChange={onChange}
                        onBlur={this.onBlur}
                        type="text"
                        readOnly={readOnly} />
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
                        clearable={true} />

                </LineInput>
                <LineInput readOnly={readOnly} className="sd-line-input__usage-flag">
                    <Label text={gettext('public')} />
                    <Toggle
                        value={get(value, 'public', true)}
                        onChange={(e) => onChange(`${field}.public`, e.target.value)}
                        readOnly={readOnly || this.state.preventSwitch} />
                </LineInput>
                <LineInput readOnly={readOnly}>
                    {!readOnly &&
                        (<a tabIndex={0} className="icn-btn sd-line-input__icon" onClick={remove}
                            onKeyDown={(event) => {
                                if (event && event.keyCode === KEYCODES.ENTER) {
                                    event.preventDefault();
                                    remove();
                                }
                            }}
                        >
                            <i className="icon-trash" />
                        </a>)
                    }
                </LineInput>

            </Row>
        );
    }
}

ContactNumberInput.propTypes = {
    remove: PropTypes.func,
    field: PropTypes.string,
    value: PropTypes.object,
    label: PropTypes.string,
    onChange: PropTypes.func,
    readOnly: PropTypes.bool,
    usages: PropTypes.array,
};

ContactNumberInput.defaultProps = {
    readOnly: false,
};
