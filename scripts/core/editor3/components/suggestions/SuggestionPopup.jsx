import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import moment from 'moment';
import ng from 'core/services/ng';
import {Dropdown} from 'core/ui/components';
import {UserAvatar} from 'apps/users/components';
import {acceptSuggestion, rejectSuggestion} from '../../actions';
import * as Highlights from '../../helpers/highlights';

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

        ng.get('api')('users').getById(this.props.suggestion.author)
            .then((author) => {
                this.setState({author});
            })
            .catch((error) => {
                this.setState({error: gettext('An error occured, please try again.')});
            });
    }

    onAccept() {
        this.props.acceptSuggestion(this.props.suggestion);
    }

    onReject() {
        this.props.rejectSuggestion(this.props.suggestion);
    }

    render() {
        if (this.state.error !== null) {
            return <Dropdown open={true}>{this.state.error}</Dropdown>;
        }
        if (this.state.author === null) {
            return null;
        }

        var gettextCatalog = ng.get('gettextCatalog');
        const gettext = gettextCatalog.getString.bind(gettextCatalog);

        const {author} = this.state;
        const {date} = this.props.suggestion;

        const fromNow = moment(date).calendar();
        const fullDate = moment(date).format('MMMM Do YYYY, h:mm:ss a');

        const description = Highlights.getHighlightDescription(this.props.suggestion.type);

        return (
            <Dropdown open={true}>
                <div className="highlights-popup__header">
                    <UserAvatar displayName={author.display_name} pictureUrl={author.picture_url} />
                    <div className="user-info">
                        <div className="author-name">{author.display_name}</div>
                        <div className="date" title={fromNow}>{fullDate}</div>
                    </div>
                </div>
                {this.props.suggestion.oldText == null &&
                    <div>
                        <strong>{gettext(description)}: </strong>
                        {this.props.suggestion.suggestionText}
                    </div>
                }
                {this.props.suggestion.oldText != null &&
                    <div>
                        <div>
                            <strong>{gettext('Replace')}: </strong>
                            {this.props.suggestion.oldText}
                        </div>
                        <div>
                            <strong>{gettext('with')}: </strong>
                            {this.props.suggestion.suggestionText}
                        </div>
                    </div>
                }
                <br />
                <div>
                    <button className="btn btn--small btn--hollow" onClick={this.onAccept}>
                        {gettext('Accept')}
                    </button>
                    <button className="btn btn--small btn--hollow" onClick={this.onReject}>
                        {gettext('Reject')}
                    </button>
                </div>
            </Dropdown>
        );
    }
}

Suggestion.propTypes = {
    suggestion: PropTypes.shape({
        author: PropTypes.string,
        date: PropTypes.date,
        suggestionText: PropTypes.string,
        oldText: PropTypes.string,
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
