import React, {Component} from 'react';
import moment from 'moment';
import {UserAvatar} from 'apps/users/components';
import PropTypes from 'prop-types';
import ng from 'core/services/ng';


/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name SuggestionPopup
 * @param {Object} suggestion SuggestionPopup data.
 * @description Displays author, date and suggestion text. Allows accepting or declining a suggestion.
 */

export class SuggestionPopup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            author: null,
            error: null
        };
    }
    componentDidMount() {
        ng.get('api')('users').getById(this.props.suggestion.data.author)
            .then((author) => {
                this.setState({author});
            })
            .catch((error) => {
                this.setState({error});
            });
    }
    render() {
        if (this.state.error !== null) {
            return <div>ERROR: {this.state.error}</div>;
        }
        if (this.state.author === null) {
            return <div>loading...</div>;
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
                    <button className="btn btn--small btn--hollow">
                        {gettext('Accept')}
                    </button>
                    <button className="btn btn--small btn--hollow">
                        {gettext('Reject')}
                    </button>
                </div>
            </div>
        );
    }
}

SuggestionPopup.propTypes = {
    suggestion: PropTypes.shape({
        data: PropTypes.shape({
            author: PropTypes.string,
            date: PropTypes.date
        }),
        suggestionText: PropTypes.string,
        type: PropTypes.string
    })
};
