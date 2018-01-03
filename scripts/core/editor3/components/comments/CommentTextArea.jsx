import React from 'react';
import PropTypes from 'prop-types';
import {Mention, MentionsInput} from 'react-mentions';
import {UserAvatar} from 'apps/users/components';
import mentionsStyle from './mentionsStyle';
import ng from 'core/services/ng';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name CommentInputBody
 * @param {Function} applyComment Called when a new comment is submitted. It receives the
 * comment body as a parameter.
 * @param {Function} hidePopups
 * @description CommentInputBody holds the dropdown that is used to enter the text for a
 * comment.
 */
class CommentTextArea extends React.Component {
    constructor(props) {
        super(props);
        this.suggestUser = this.suggestUser.bind(this);
        this.suggestDesk = this.suggestDesk.bind(this);
        this.renderSuggestion = this.renderSuggestion.bind(this);
        this.userList = ng.get('userList');
        this.desks = ng.get('desks');
    }

    componentDidMount() {
        $('.comment-input textarea').focus();
    }

    /**
     * @ngdoc method
     * @name CommentInputBody#suggestDesk
     * @param {String} q Query string for mentions
     * @param {Function<Array>} cb Callback for async ops on requesting the results.
     * @description suggest returns the list of suggestions for a given query q.
     */
    suggestDesk(q, cb) {
        this.desks.initialize().then(() =>
            cb(
                this.desks.desks._items
                    .filter(({name}) => name.toLowerCase().indexOf(q.toLowerCase()) > -1)
                    .map((d) => ({
                        id: d._id,
                        display: d.name,
                        type: 'desk'
                    }))
            )
        );
    }

    /**
     * @ngdoc method
     * @name CommentInputBody#suggestUser
     * @param {String} q Query string for mentions
     * @param {Function<Array>} cb Callback for async ops on requesting the results.
     * @description suggest returns the list of suggestions for a given query q.
     */
    suggestUser(q, cb) {
        this.userList.get(q).then((users) =>
            cb(
                users._items.map((u) => ({
                    id: u._id,
                    display: u.display_name,
                    type: 'user'
                }))
            )
        );
    }

    /**
     * @ngdoc method
     * @name CommentInputBody#renderSuggestion
     * @description renderSuggestion renders each list item to be displayed in the
     * suggested items dropdown based on its data.
     * @returns {JSX}
     */
    renderSuggestion({type, display}, search, highlightedDisplay) {
        return (
            <div className="entry">
                {type === 'desk' ? <i className="icon-tasks" /> : <UserAvatar displayName={display} />}
                {highlightedDisplay}
            </div>
        );
    }

    render() {
        return (
            <div className="comment-textarea">
                <MentionsInput
                    value={this.props.value}
                    onChange={this.props.onChange}
                    style={mentionsStyle.input}
                    className="mentions-input"
                    markup="@[__display__](__type__:__id__)"
                    placeholder={gettext('Type your comment...')}
                >
                    <Mention
                        trigger="@"
                        type="user"
                        data={this.suggestUser}
                        renderSuggestion={this.renderSuggestion}
                        style={mentionsStyle.mention}
                        appendSpaceOnAdd
                    />

                    <Mention
                        trigger="#"
                        type="desk"
                        data={this.suggestDesk}
                        renderSuggestion={this.renderSuggestion}
                        style={mentionsStyle.mention}
                        appendSpaceOnAdd
                    />
                </MentionsInput>
            </div>
        );
    }
}

CommentTextArea.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
};

export default CommentTextArea;
