import React from 'react';
import {UserAvatar} from 'apps/users/components';
import PropTypes from 'prop-types';
import moment from 'moment';
import {connect} from 'react-redux';
import {deleteHighlight} from '../../actions';
import ng from 'core/services/ng';

const Annotation = ({annotation, deleteHighlight}) => {
    const {author, avatar, date, msg} = annotation.data;
    const fromNow = moment(date).calendar();
    const fullDate = moment(date).format('MMMM Do YYYY, h:mm:ss a');
    const modal = ng.get('modal');
    const deleteAnnotation = () => {
        modal.confirm(gettext('The annotation will be deleted. Are you sure?'))
            .then(() => deleteHighlight(annotation));
    };

    return (
        <div>
            <div className="highlights-popup__header">
                <UserAvatar displayName={author} pictureUrl={avatar} />
                <div className="user-info">
                    <div className="author-name">{author}</div>
                    <div className="date" title={fullDate}>{fromNow}</div>
                </div>
            </div>
            <div className="highlights-popup__html" dangerouslySetInnerHTML={{__html: msg}} />
            <a onClick={deleteAnnotation}>Delete</a>
        </div>
    );
};

Annotation.propTypes = {
    deleteHighlight: PropTypes.func,
    annotation: PropTypes.object
};

export const AnnotationPopup = connect(null, {
    deleteHighlight
})(Annotation);
