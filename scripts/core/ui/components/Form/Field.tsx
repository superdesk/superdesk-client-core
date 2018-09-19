import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {Row} from './Row';

/**
 * @ngdoc react
 * @name Field
 * @description Component to encapsulate an input component in a form as a Field
 */
export class Field extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);

        this.state = {dirty: false};
    }

    componentWillReceiveProps(nextProps) {
        const {field, formProfile} = this.props;

        // If this field is disabled, then no need to perform checks
        if (!nextProps.enabled || !get(formProfile, `editor.${field}.enabled`, true)) {
            return;
        }

        // If the initial value changes, then we assume the form input object has changed too
        // i.e. changed to a different Event instance
        // In that case, set the dirty flag back to false
        if (get(nextProps.item, field) !== get(this.props.item, field)) {
            this.setState({dirty: false});
        } else if (
            get(nextProps.diff, field) !== get(this.props.diff, field) ||
            get(nextProps, 'value') !== get(this.props, 'value')
        ) {
            this.setState({dirty: true});
        }
    }

    render() {
        const {
            component,
            field,
            profileName,
            diff,
            onChange,
            defaultValue,
            formProfile,
            errors,
            error,
            row,
            enabled,
            showErrors,
            value,
            onFocus,
            ...props
        } = this.props;

        const profileField = profileName || field;

        if (!enabled || !get(formProfile, `editor["${profileField}"].enabled`, true)) {
            return null;
        }

        const schema = get(formProfile, `schema["${profileField}"]`) || {};
        const currentError = (this.state.dirty || showErrors) ? (error || get(errors, field)) : null;
        const currentValue = value || get(diff, field);
        // console.log('field', currentError, showErrors, errors);

        const Component = component;
        const child = <Component
            field={field}
            profileField={profileField}
            value={currentValue || defaultValue}
            diff={diff}
            onChange={onChange}
            maxLength={schema.validate_on_post ? 0 : schema.maxlength}
            required={schema.validate_on_post ? false : schema.required}
            message={currentError}
            invalid={!!currentError}
            errors={errors}
            showErrors={showErrors}
            dirty={this.state.dirty}
            formProfile={formProfile}
            row={row}
            onFocus={onFocus}
            {...props}
        />;

        return row ? <Row>{child}</Row> : child;
    }
}

Field.propTypes = {
    component: PropTypes.func.isRequired,
    field: PropTypes.string.isRequired,
    profileName: PropTypes.string,
    label: PropTypes.string,
    item: PropTypes.object,
    diff: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    defaultValue: PropTypes.any,
    formProfile: PropTypes.object,
    errors: PropTypes.object,
    error: PropTypes.string,
    row: PropTypes.bool,
    enabled: PropTypes.bool,
    showErrors: PropTypes.bool,
    value: PropTypes.any,
    onFocus: PropTypes.func,
};

Field.defaultProps = {
    defaultValue: '',
    row: true,
    enabled: true,
    showErrors: false,
};
