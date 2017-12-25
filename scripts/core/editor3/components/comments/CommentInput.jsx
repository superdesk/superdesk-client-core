import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Dropdown} from 'core/ui/components';
import {Mention, MentionsInput} from 'react-mentions';
import {UserAvatar} from 'apps/users/components';
import mentionsStyle from './mentionsStyle';
import ng from 'core/services/ng';
import {connect} from 'react-redux';
import {applyComment, hidePopups} from '../../actions';

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
class CommentInputBody extends Component {
    constructor(props) {
        super(props);

        this.state = {msg: props.data.msg || ''};

        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
        this.suggestUser = this.suggestUser.bind(this);
        this.suggestDesk = this.suggestDesk.bind(this);
        this.renderSuggestion = this.renderSuggestion.bind(this);

        this.userList = ng.get('userList');
        this.desks = ng.get('desks');
    }

    /**
     * @ngdoc method
     * @name CommentInputBody#onSubmit
     * @description onSubmit is called when the user clicks the Submit button in the UI.
     * Consequently, it calls the `onSubmit` prop, passing it the value of the text input.
     */
    onSubmit() {
        const {msg} = this.state;
        const {applyComment, hidePopups, data} = this.props;

        if (msg !== '') {
            applyComment(data.selection, {msg});
            hidePopups();
        }
    }

    /**
     * @ngdoc method
     * @name CommentInputBody#onChange
     * @description onChange is triggered when the Textarea content changes.
     */
    onChange(ev, value) {
        this.setState({msg: value});
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
        const {msg} = this.state;

        return (
            <div className="comment-input">
                <Dropdown open={true}>
                    <MentionsInput
                        value={msg}
                        onChange={this.onChange}
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
                    <div className="pull-right">
                        <button className="btn btn--cancel" onClick={this.props.hidePopups}>{gettext('Cancel')}</button>
                        <button className="btn btn--primary" onClick={this.onSubmit}>{gettext('Submit')}</button>
                    </div>
                </Dropdown>
            </div>
        );
    }
}

CommentInputBody.propTypes = {
    applyComment: PropTypes.func,
    hidePopups: PropTypes.func,
    data: PropTypes.object
};

export const CommentInput = connect(null, {
    applyComment,
    hidePopups
})(CommentInputBody);
