import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import moment from 'moment';
import ng from 'core/services/ng';
import {UserAvatar} from 'apps/users/components';
import {acceptSuggestion, rejectSuggestion} from '../../actions';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name SuggestionPopup
 * @param {Object} suggestion SuggestionPopup data.
 * @description Displays author, date and suggestion text. Allows accepting or declining a suggestion.
 */

class Suggestion extends Component {
    constructor(props) {
        super(props);
        this.state = {
            author: null,
            error: null
        };

        this.onAccept = this.onAccept.bind(this);
        this.onReject = this.onReject.bind(this);
    }

    componentDidMount() {
        var gettextCatalog = ng.get('gettextCatalog');
        const gettext = gettextCatalog.getString.bind(gettextCatalog);

        ng.get('api')('users').getById(this.props.suggestion.data.author)
            .then((author) => {
                this.setState({author});
            })
            .catch((error) => {
                this.setState({error: gettext('An error occured, please try again.')});
            });
    }

    onAccept() {
        // TODO: close widget
        this.props.acceptSuggestion(this.props.suggestion.selection);
    }

    onReject() {
        // TODO: close widget
        this.props.rejectSuggestion(this.props.suggestion.selection);
    }

    render() {
        if (this.state.error !== null) {
            return <div open={true}>{this.state.error}</div>;
        }
        if (this.state.author === null) {
            return null;
        }

        var gettextCatalog = ng.get('gettextCatalog');
        const gettext = gettextCatalog.getString.bind(gettextCatalog);

        const {author} = this.state;
        const {date} = this.props.suggestion.data;

        const fromNow = moment(date).calendar();
        const fullDate = moment(date).format('MMMM Do YYYY, h:mm:ss a');

        const actionNames = {
            ADD_SUGGESTION: gettext('Add'),
            DELETE_SUGGESTION: gettext('Remove'),
        };

        return (
            <div>
                <div className="highlights-popup__header">
                    <UserAvatar displayName={author.display_name} pictureUrl={author.picture_url} />
                    <div className="user-info">
                        <div className="author-name">{author.display_name}</div>
                        <div className="date" title={fullDate}>{fromNow}</div>
                    </div>
                </div>
                <div>
                    <strong>{actionNames[this.props.suggestion.type]}: </strong>
                    {this.props.suggestion.suggestionText}
                </div>
                <br />
                <div>
                    <button className="btn btn--small btn--hollow" onClick={this.onAccept}>
                        {gettext('Accept')}
                    </button>
                    <button className="btn btn--small btn--hollow" onClick={this.onReject}>
                        {gettext('Reject')}
                    </button>
                </div>
            </div>
        );
    }
}

Suggestion.propTypes = {
    suggestion: PropTypes.shape({
        data: PropTypes.shape({
            author: PropTypes.string,
            date: PropTypes.date
        }),
        suggestionText: PropTypes.string,
        type: PropTypes.string,
        selection: PropTypes.object
    }),
    acceptSuggestion: PropTypes.func,
    rejectSuggestion: PropTypes.func
};

export const SuggestionPopup = connect(null, {
    acceptSuggestion,
    rejectSuggestion
})(Suggestion);
