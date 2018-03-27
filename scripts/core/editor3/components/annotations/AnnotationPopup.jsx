import React from 'react';
import {UserAvatar} from 'apps/users/components';
import PropTypes from 'prop-types';
import moment from 'moment';
import {connect} from 'react-redux';
import {showPopup, PopupTypes} from '../../actions';
import {toHTML} from 'core/editor3';
import {convertFromRaw} from 'draft-js';
import ng from 'core/services/ng';

const Annotation = ({annotation, showPopup, highlightId, highlightsManager}) => {
    const {author, avatar, date, msg, annotationType: type} = annotation.data;
    const fromNow = moment(date).calendar();
    const fullDate = moment(date).format('MMMM Do YYYY, h:mm:ss a');
    const logger = ng.get('logger');
    const html = toHTML(convertFromRaw(JSON.parse(msg)), logger);
    const modal = ng.get('modal');

    const onEdit = () => showPopup(PopupTypes.Annotation, {annotation, highlightId});
    const onDelete = () => modal
        .confirm(gettext('The annotation will be deleted. Are you sure?'))
        .then(() => {
            highlightsManager.removeHighlight(highlightId);
        });

    return (
        <div>
            <div className="highlights-popup__header">
                <UserAvatar displayName={author} pictureUrl={avatar} />
                <div className="user-info">
                    <div className="author-name">{author}</div>
                    <div className="date" title={fromNow}>{fullDate}</div>
                </div>
            </div>

            <div className="highlights-popup__type"><b>{gettext('Annotation type')}: </b>{type}</div>
            <div className="highlights-popup__html" dangerouslySetInnerHTML={{__html: html}} />

            <a className="btn btn--small btn--hollow" onClick={onEdit}>{gettext('Edit')}</a>
            <a className="btn btn--small btn--hollow" onClick={onDelete}>{gettext('Delete')}</a>
        </div>
    );
};

Annotation.propTypes = {
    showPopup: PropTypes.func,
    annotation: PropTypes.object,
    highlightsManager: PropTypes.object.isRequired,
    highlightId: PropTypes.string,
};

export const AnnotationPopup = connect(null, {
    showPopup,
})(Annotation);
