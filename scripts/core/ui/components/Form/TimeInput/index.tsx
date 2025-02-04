import React from 'react';
import PropTypes from 'prop-types';
import * as momentAlias from 'moment';
import {LineInput, Label, Input} from '../';
import {TimeInputPopup} from './TimeInputPopup';
import {IconButton} from '../../';
import {KEYCODES} from '../../constants';
import './style.scss';

const moment: any = momentAlias;

/**
 * @ngdoc react
 * @name TimeInput
 * @description Component to pick time in hours and minutes
 */
export class TimeInput extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    dom: any;

    constructor(props) {
        super(props);
        this.state = {
            openTimePicker: false,
            invalid: false,
            viewValue: '',
            previousValidValue: '',
        };

        this.dom = {inputField: null};
        this.handleInputBlur = this.handleInputBlur.bind(this);
        this.validateTimeText = this.validateTimeText.bind(this);
        this.toggleOpenTimePicker = this.toggleOpenTimePicker.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        const val = nextProps.value && moment.isMoment(nextProps.value) ?
            nextProps.value.format(this.props.timeFormat) : '';

        this.setState({
            viewValue: val,
            previousValidValue: val,
        });
    }

    componentDidMount() {
        // After first render, set the value
        const value = this.props.value;
        const viewValue = value && moment.isMoment(value) ? value.format(this.props.timeFormat) : '';

        this.setState({viewValue});
    }

    toggleOpenTimePicker() {
        this.setState({openTimePicker: !this.state.openTimePicker});

        if (this.state.openTimePicker) {
            // Keep the focus to enable tab navigation
            this.dom.inputField.focus();
        }
    }

    validateTimeText(field, val) {
        const regex = new RegExp('^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$', 'i');

        if (!val.match(regex)) {
            this.setState({
                invalid: true,
                viewValue: val,
            });
        } else {
            this.setState({
                invalid: false,
                viewValue: val,
                previousValidValue: val,
            });
            this.onChange(val);
        }
    }

    /**
    * @ngdoc method
    * @name TimeInput#handleInputBlur
    * @description handleInputBlur resets view-value incase of invalid time input
    */
    handleInputBlur() {
        if (this.state.invalid) {
            this.setState({
                viewValue: this.state.previousValidValue,
                invalid: false,
            });
        }
    }

    onChange(newValue) {
        const {value, onChange, field, timeFormat} = this.props;
        // Takes the time as a string (based on the configured time format)
        // Then parses it and calls parents onChange with new moment object
        const newTime = moment(newValue, timeFormat);
        const newMoment = value && moment.isMoment(value) ? moment(value) : moment();

        newMoment.hour(newTime.hour());
        newMoment.minute(newTime.minute());
        newMoment.second(0);

        if (!newMoment.isSame(value) || !value) {
            onChange(field, newMoment);
        }
    }

    render() {
        const {placeholder, field, label, value, readOnly, popupContainer, onFocus, ...props} = this.props;

        return (
            <LineInput {...props} readOnly={readOnly}>
                <Label text={label} />
                <IconButton
                    className="sd-line-input__icon-right"
                    icon="icon-time"
                    onFocus={onFocus}
                    onClick={!readOnly ? this.toggleOpenTimePicker : null}
                />
                <Input
                    field={field}
                    value={this.state.viewValue}
                    onChange={this.validateTimeText}
                    type="text"
                    placeholder={placeholder}
                    onBlur={this.handleInputBlur}
                    readOnly={readOnly}
                    onFocus={onFocus}
                    onKeyDown={(event) => {
                        if (event.keyCode === KEYCODES.ENTER) {
                            this.setState({openTimePicker: true});
                        }
                    }
                    }
                    refNode={(ref) => this.dom.inputField = ref}
                />
                {this.state.openTimePicker && (
                    <TimeInputPopup
                        value={value}
                        onChange={this.onChange}
                        close={this.toggleOpenTimePicker}
                        target="icon-time"
                        popupContainer={popupContainer}
                    />
                )}
            </LineInput>
        );
    }
}

TimeInput.propTypes = {
    field: PropTypes.string.isRequired,
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(moment),
    ]),
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    timeFormat: PropTypes.string.isRequired,

    hint: PropTypes.string,
    message: PropTypes.string,
    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
    popupContainer: PropTypes.func,
    onFocus: PropTypes.func,
};

TimeInput.defaultProps = {
    placeholder: 'Time',
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
};
