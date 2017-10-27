import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {LinkInput} from '../links';
import {CommentInput} from '../comments';
import {AnnotationInput} from '../annotations';
import {EmbedInput} from '../embeds';
import {PopupTypes} from '.';
import {connect} from 'react-redux';
import * as actions from '../../actions';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @param {Function} onCancel
 * @param {PopupTypes} type Popup type.
 * @param {Object} data Metadata to pass to the pop-up (generally the SelectionState in the editor at
 * the time.
 * @description ToolbarPopupComponent renders the popup specified by the type property and passes it
 * the onCancel value along with the given prop data.
 */
class ToolbarPopupComponent extends Component {
    render() {
        const {onCancel, type, data, applyLink, applyComment, applyAnnotation, embedCode} = this.props;

        switch (type) {
        case PopupTypes.Annotation:
            return <AnnotationInput onSubmit={applyAnnotation} onCancel={onCancel} value={data} />;
        case PopupTypes.Comment:
            return <CommentInput onSubmit={applyComment} onCancel={onCancel} value={data} />;
        case PopupTypes.Link:
            return <LinkInput onSubmit={applyLink} onCancel={onCancel} value={data} />;
        case PopupTypes.Embed:
            return <EmbedInput onSubmit={embedCode} onCancel={onCancel} />;
        }

        return null;
    }
}

ToolbarPopupComponent.propTypes = {
    applyLink: PropTypes.func,
    applyComment: PropTypes.func,
    applyAnnotation: PropTypes.func,
    embedCode: PropTypes.func,
    onCancel: PropTypes.func,
    type: PropTypes.string,
    data: PropTypes.object,
};

const mapDispatchToProps = (dispatch) => ({
    applyLink: (link, entity = null) => dispatch(actions.applyLink({link, entity})),
    applyComment: (sel, data) => dispatch(actions.applyComment(sel, data)),
    applyAnnotation: (sel, data) => dispatch(actions.applyAnnotation(sel, data)),
    embedCode: (code) => dispatch(actions.embed(code))
});

export const ToolbarPopup = connect(null, mapDispatchToProps)(ToolbarPopupComponent);
