import React from 'react';
import PropTypes from 'prop-types';

export default class ObjectEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {value: angular.toJson(props.value || {}, 2)};
        this.onChange = this.onChange.bind(this);
    }

    onChange(event) {
        this.setState({value: event.target.value});

        try {
            const parsed = angular.fromJson(event.target.value);

            this.props.onChange(parsed);
        } catch (err) {
            // pass
        }
    }

    render() {
        const lines = this.state.value.split('\n').length;

        return (
            <textarea rows={lines} cols="30"
                value={this.state.value}
                disabled={this.props.disabled}
                onChange={this.onChange}
            />
        );
    }
}

ObjectEditor.propTypes = {
    value: PropTypes.object,
    disabled: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
};