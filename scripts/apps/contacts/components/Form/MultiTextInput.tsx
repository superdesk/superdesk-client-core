import React from 'react';
import PropTypes from 'prop-types';
import {Row, LineInput, Input} from './';
import {KEYCODES} from '../../../contacts/constants';
import {isEmpty, get, set} from 'lodash';
import {gettext} from 'core/utils';

export class MultiTextInput extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    errorMessage: any;

    constructor(props) {
        super(props);
        this.state = {
            touched: {},
        };
        this.onBlur = this.onBlur.bind(this);
        this.isFieldInvalid = this.isFieldInvalid.bind(this);
        this.errorMessage = '';
    }

    onBlur(e) {
        const _touched = this.state.touched;

        set(_touched, e.target.name, true);

        this.setState({touched: _touched});
    }

    isFieldInvalid(field, value, errors) {
        this.errorMessage = get(this.state.touched, field, false) &&
            isEmpty(value) ? gettext('This field is required.') : get(errors, field, '');

        return !isEmpty(this.errorMessage);
    }

    render() {
        const {value, field, remove, onChange, label, readOnly, errors, ...props} = this.props;

        return (
            <Row>
                <LineInput {...props} readOnly={readOnly}
                    invalid={this.isFieldInvalid(field, value, errors)}
                    message={this.errorMessage}>
                    {label && <label className="sd-line-input__label">{label}</label>}
                    <Input
                        field={field}
                        value={value}
                        onChange={onChange}
                        onBlur={this.onBlur}
                        type={props.type}
                        readOnly={readOnly} />

                    {!readOnly &&
                            (<div>
                                <a tabIndex={0} className="icn-btn sd-line-input__icon-right" onClick={remove}
                                    onKeyDown={(event) => {
                                        if (event && event.keyCode === KEYCODES.ENTER) {
                                            event.preventDefault();
                                            remove();
                                        }
                                    }}>
                                    <i className="icon-trash" />
                                </a>
                            </div>)
                    }
                </LineInput>
            </Row>
        );
    }
}

MultiTextInput.propTypes = {
    remove: PropTypes.func,
    field: PropTypes.string,
    type: PropTypes.string,
    value: PropTypes.string,
    label: PropTypes.string,
    onChange: PropTypes.func,
    readOnly: PropTypes.bool,
    errors: PropTypes.object,
};

MultiTextInput.defaultProps = {
    readOnly: false,
    value: '',
    type: 'text',
};
