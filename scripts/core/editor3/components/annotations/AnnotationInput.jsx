import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Dropdown} from 'core/ui/components';
import {Editor} from 'core/editor3';
import {connect} from 'react-redux';
import {convertToRaw} from 'draft-js';

import {
    applyAnnotation,
    updateHighlight as updateAnnotation,
    hidePopups,
    deleteHighlight
} from '../../actions';

import ng from 'core/services/ng';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @param {Function} hidePopups
 * @param {Function} applyAnnotation Receives value (generally SelectionState) and highlight data.
 * @description AnnotationInput is the popup containing the fields needed to fill in information
 * about an annotation.
 */
class AnnotationInputBody extends Component {
    constructor(props) {
        super(props);

        const {data} = props;
        const editing = typeof data.annotation === 'object';

        let body = null;
        let annotationTypes = ng.get('metadata').values.annotation_types;
        let type = annotationTypes.length > 0 ? annotationTypes[0].name : '';

        if (editing) {
            ({annotationType: type, msg: body} = data.annotation.data);
            body = JSON.parse(body);
        }

        this.state = {body, type, annotationTypes};
        this.initialContent = body;

        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onSelect = this.onSelect.bind(this);
        this.deleteAnnotation = this.deleteAnnotation.bind(this);
    }

    /**
     * @ngdoc method
     * @name CommentInput#onSubmit
     * @description onSubmit is called when the user clicks the Submit button in the UI.
     * Consequently, it calls the `onSubmit` prop, passing it the value of the text input.
     */
    onSubmit() {
        const {body, type} = this.state;
        const {updateAnnotation, applyAnnotation, hidePopups, data} = this.props;
        const update = typeof data.annotation === 'object';

        if (body !== '') {
            if (update) {
                data.annotation.data.annotationType = type;
                data.annotation.data.msg = JSON.stringify(body);

                updateAnnotation(data.annotation);
            } else {
                applyAnnotation(data.selection, {
                    msg: JSON.stringify(body),
                    annotationType: type
                });
            }

            hidePopups();
        }
    }

    /**
     * @ngdoc method
     * @name CommentInput#onChange
     * @param {ContentState} content
     * @description onChange is triggered when the content of the editor changes.
     */
    onChange(content) {
        this.setState({body: convertToRaw(content)});
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

    deleteAnnotation() {
        const {annotation} = this.props.data;
        const {deleteHighlight, hidePopups} = this.props;

        ng.get('modal')
            .confirm(gettext('The annotation will be deleted. Are you sure?'))
            .then(() => deleteHighlight(annotation));

        hidePopups();
    }

    render() {
        const {hidePopups, data} = this.props;
        const {annotation} = data;
        const {type, annotationTypes} = this.state;

        return (
            <div className="annotation-input">
                <Dropdown open={true}>
                    {annotationTypes &&
                        <div className="sd-line-input sd-line-input--is-select">
                            <label className="sd-line-input__label">Annotation Type</label>
                            <select className="sd-line-input__select" onChange={this.onSelect} value={type}>
                                {annotationTypes.map((annotationType) =>
                                    <option key={annotationType.name} value={annotationType.name}>
                                        {annotationType.name}
                                    </option>
                                )}
                            </select>
                        </div>
                    }
                    <label className="sd-line-input__label">Annotation Body</label>
                    <Editor
                        onChange={this.onChange}
                        editorFormat={['bold', 'italic', 'underline', 'anchor']}
                        editorState={this.initialContent}
                    />
                    <div className="pull-right">
                        {typeof annotation === 'object' &&
                            <button
                                className="btn btn--cancel"
                                onClick={this.deleteAnnotation}>
                                {gettext('Delete')}
                            </button>}
                        <button className="btn btn--cancel" onClick={hidePopups}>{gettext('Cancel')}</button>
                        <button className="btn btn--primary" onClick={this.onSubmit}>{gettext('Submit')}</button>
                    </div>
                </Dropdown>
            </div>
        );
    }
}

AnnotationInputBody.propTypes = {
    updateAnnotation: PropTypes.func,
    applyAnnotation: PropTypes.func,
    hidePopups: PropTypes.func,
    deleteHighlight: PropTypes.func,
    data: PropTypes.object
};

export const AnnotationInput = connect(null, {
    applyAnnotation,
    updateAnnotation,
    deleteHighlight,
    hidePopups
})(AnnotationInputBody);
