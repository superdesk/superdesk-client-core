import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {LinkInput} from '../links';
import {CommentInput} from '../comments';
import {AnnotationInput} from '../annotations';
import {EmbedInput} from '../embeds';
import {PopupTypes} from '.';
import {connect} from 'react-redux';
import * as actions from '../../actions';

class ToolbarButtonComponent extends Component {
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

ToolbarButtonComponent.propTypes = {
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

export const ToolbarPopup = connect(null, mapDispatchToProps)(ToolbarButtonComponent);
