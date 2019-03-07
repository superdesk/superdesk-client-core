import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

import {gettext} from 'core/utils';

import {LineInput, Label} from '../';
import {ColouredValuePopup} from './ColouredValuePopup';

/**
 * @ngdoc react
 * @name ColouredValueInput
 * @description Component to show color coded values. Eg. Urgency / Priority
 */
export class ColouredValueInput extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.state = {openPopup: false};

        this.togglePopup = this.togglePopup.bind(this);
        this.getIconClasses = this.getIconClasses.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    /**
    * @ngdoc method
    * @name ColouredValueInput#togglePopup
    * @description togglePopup method to toggle open state of opop-up component
    */
    togglePopup() {
        this.setState({openPopup: !this.state.openPopup});
    }

    /**
     * @ngdoc method
     * @name ColouredValueInput#getIconClasses
     * @description getIconClasses returns appropriate icon class for a given value.
     * @returns {string} Icon class-name
     */
    getIconClasses(val) {
        return val ? classNames('line-input',
            this.props.iconName,
            this.props.iconName + '--' + get(val, this.props.valueKey, get(val, this.props.labelKey))) : 'line-input';
    }

    onChange(value) {
        this.props.onChange(this.props.field, get(value, this.props.valueKey) ? value : null);
        this.togglePopup();
    }

    render() {
        const {
            required,
            value,
            label,
            readOnly,
            labelLeft,
            clearable,
            options,
            labelKey,
            valueKey,
            noMargin,
            popupContainer,
            row,
            noValueString,
            onFocus,
            ...props
        } = this.props;

        return (
            <LineInput
                className="select-coloured-value"
                required={required}
                readOnly={readOnly}
                labelLeft={labelLeft}
                noMargin={noMargin}
                {...props}
            >
                <Label text={label} row={row} light={row && readOnly} />
                {readOnly ? (
                    <LineInput labelLeft={labelLeft} className="select-coloured-value__input">
                        <span className={this.getIconClasses(value)}>
                            {get(value, valueKey, get(value, labelKey, noValueString || gettext('None')))}
                        </span>
                        <span>
                        &nbsp;&nbsp;{get(value, labelKey, '')}
                        </span>
                    </LineInput>
                ) : (
                    <button type="button"
                        className="dropdown__toggle select-coloured-value__input line-input"
                        onClick={this.togglePopup}
                        onFocus={onFocus}
                    >
                        <span className={this.getIconClasses(value)}>
                            {get(value, valueKey, get(value, labelKey, noValueString || gettext('None')))}
                        </span>
                        &nbsp;&nbsp;{get(value, labelKey, '')}
                        <b className="dropdown__caret" />
                    </button>
                )}

                {this.state.openPopup && (
                    <ColouredValuePopup
                        title={label}
                        options={options}
                        getClassNamesForOption={this.getIconClasses}
                        onChange={this.onChange}
                        onCancel={this.togglePopup}
                        clearable={clearable}
                        target="dropdown__caret"
                        labelKey={labelKey}
                        valueKey={valueKey}
                        popupContainer={popupContainer}
                    />
                )}
            </LineInput>
        );
    }
}

ColouredValueInput.propTypes = {
    options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.object,
    })).isRequired,
    readOnly: PropTypes.bool,
    iconName: PropTypes.string.isRequired,
    required: PropTypes.bool,
    labelLeft: PropTypes.bool,
    clearable: PropTypes.bool,

    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.object,
    onChange: PropTypes.func,
    labelKey: PropTypes.string,
    valueKey: PropTypes.string,
    noMargin: PropTypes.bool,
    popupContainer: PropTypes.func,
    row: PropTypes.bool,
    noValueString: PropTypes.string,
    onFocus: PropTypes.func,
};

ColouredValueInput.defaultProps = {
    required: false,
    labelLeft: false,
    clearable: true,
    labelKey: 'name',
    valueKey: 'qcode',
    noMargin: false,
    readOnly: false,
    row: false,
};
