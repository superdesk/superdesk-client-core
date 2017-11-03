import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Dropdown} from 'core/ui/components';
import {toHTML, Editor} from 'core/editor3';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @param {Function} onCancel
 * @param {Function} onSubmit Receives value (generally SelectionState) and highlight data.
 * @description AnnotationInput is the popup containing the fields needed to fill in information
 * about an annotation.
 */
export class AnnotationInput extends Component {
    constructor(props) {
        super(props);

        this.state = {body: '', type: 'regular'};

        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onSelect = this.onSelect.bind(this);
    }

    /**
     * @ngdoc method
     * @name CommentInput#onSubmit
     * @description onSubmit is called when the user clicks the Submit button in the UI.
     * Consequently, it calls the `onSubmit` prop, passing it the value of the text input.
     */
    onSubmit() {
        const {body, type} = this.state;
        const {onSubmit, onCancel, value} = this.props;

        if (body !== '') {
            onSubmit(value, {
                msg: body,
                annotationType: type
            });
            onCancel();
        }
    }

    /**
     * @ngdoc method
     * @name CommentInput#onChange
     * @param {ContentState} content
     * @description onChange is triggered when the content of the editor changes.
     */
    onChange(content) {
        this.setState({body: toHTML(content)});
    }

    /**
     * @ngdoc method
     * @name CommentInput#onSelect
     * @param {Event} e
     * @description onSelect is triggered when the annotation type is toggled.
     */
    onSelect({target}) {
        this.setState({type: target.value});
    }

    componentDidMount() {
        $('.annotation-input textarea').focus();
    }

    render() {
        const {onCancel} = this.props;
        const {type} = this.state;

        return (
            <div className="annotation-input">
                <Dropdown open={true}>
                    <div className="sd-line-input sd-line-input--is-select">
                        <label className="sd-line-input__label">Annotation Type</label>
                        <select className="sd-line-input__select" onChange={this.onSelect} value={type}>
                            <option value="regular">Regular</option>
                            <option value="remark">Remark</option>
                        </select>
                    </div>
                    <label className="sd-line-input__label">Annotation Body</label>
                    <Editor
                        onChange={this.onChange}
                        editorFormat={['bold', 'italic', 'underline', 'anchor']}
                    />
                    <div className="pull-right">
                        <button className="btn btn--cancel" onClick={onCancel}>{gettext('Cancel')}</button>
                        <button className="btn btn--primary" onClick={this.onSubmit}>{gettext('Submit')}</button>
                    </div>
                </Dropdown>
            </div>
        );
    }
}

AnnotationInput.propTypes = {
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
    value: PropTypes.object
};
