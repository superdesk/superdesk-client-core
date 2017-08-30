import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Dropdown} from 'core/ui/components';

export class CommentInput extends Component {
    constructor(props) {
        super(props);

        this.onSubmit = this.onSubmit.bind(this);
    }

    onSubmit() {
        const {value} = this.input;
        const {onSubmit, onCancel} = this.props;

        if (value !== '') {
            onSubmit(value);
            onCancel();
        }
    }

    componentDidMount() {
        this.input.focus();
    }

    render() {
        return (
            <Dropdown open={true}>
                <input type="text"
                    ref={(el) => {
                        this.input = el;
                    }}
                    className="sd-line-input__input"
                    placeholder={gettext('Type comment here')}
                />
                <div className="pull-right">
                    <button className="btn btn--cancel"
                        onClick={this.props.onCancel}>{gettext('Cancel')}</button>
                    <button className="btn btn--primary"
                        onClick={this.onSubmit}>{gettext('Submit')}</button>
                </div>
            </Dropdown>
        );
    }
}

CommentInput.propTypes = {
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func
};
