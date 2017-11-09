import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Dropdown} from 'core/ui/components';
import {toHTML, Editor} from 'core/editor3';
import {connect} from 'react-redux';
import {applyAnnotation, hidePopups} from '../../actions';
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

        this.state = {
            annotationTypes: ng.get('metadata').values.annotation_types,
            type: '',
            body: ''
        };

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
        const {applyAnnotation, hidePopups, data} = this.props;

        if (body !== '') {
            applyAnnotation(data.selection, {
                msg: body,
                annotationType: type
            });

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
        const {hidePopups} = this.props;
        const {type, annotationTypes} = this.state;

        return (
            <div className="annotation-input">
                <Dropdown open={true}>
                    {annotationTypes &&
                        <div className="sd-line-input sd-line-input--is-select">
                            <label className="sd-line-input__label">Annotation Type</label>
                            <select className="sd-line-input__select" onChange={this.onSelect} value={type}>
                                {annotationTypes.map((annotationType) =>
                                    <option key={annotationType.qcode} value={annotationType.qcode}>
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
                    />
                    <div className="pull-right">
                        <button className="btn btn--cancel" onClick={hidePopups}>{gettext('Cancel')}</button>
                        <button className="btn btn--primary" onClick={this.onSubmit}>{gettext('Submit')}</button>
                    </div>
                </Dropdown>
            </div>
        );
    }
}

AnnotationInputBody.propTypes = {
    applyAnnotation: PropTypes.func,
    hidePopups: PropTypes.func,
    data: PropTypes.object
};

export const AnnotationInput = connect(null, {
    applyAnnotation,
    hidePopups
})(AnnotationInputBody);
