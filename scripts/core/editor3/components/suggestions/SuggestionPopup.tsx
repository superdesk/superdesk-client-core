import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';
import moment from 'moment';
import ng from 'core/services/ng';
import {Dropdown} from 'core/ui/components';
import {acceptSuggestion, rejectSuggestion} from '../../actions';
import * as Highlights from '../../helpers/highlights';
import {HighlightsPopupPresentation} from '../HighlightsPopupPresentation';
import {UserAvatar} from 'apps/users/components/UserAvatar';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name SuggestionPopup
 * @param {Object} suggestion SuggestionPopup data.
 * @description Displays author, date and suggestion text. Allows accepting or declining a suggestion.
 */

class Suggestion extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.state = {
            author: null,
            error: null,
        };

        this.onAccept = this.onAccept.bind(this);
        this.onReject = this.onReject.bind(this);
    }

    componentDidMount() {
        const gettextCatalog = ng.get('gettextCatalog');
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

    truncateText(text) {
        if (text != null && text.length > 40) {
            return text.substr(0, 25) + '...' + text.substr(-15);
        }

        return text;
    }

    render() {
        if (this.state.error !== null) {
            return <Dropdown open={true}>{this.state.error}</Dropdown>;
        }
        if (this.state.author === null) {
            return null;
        }

        const gettextCatalog = ng.get('gettextCatalog');
        const gettext = gettextCatalog.getString.bind(gettextCatalog);

        const {author} = this.state;
        const {date, suggestionText, oldText} = this.props.suggestion;

        const relativeDateString = moment(date).calendar();
        const absoluteDateString = moment(date).format('MMMM Do YYYY, h:mm:ss a');

        const description = Highlights.getHighlightDescription(this.props.suggestion.type);
        const blockStyleDescription = Highlights.getBlockStylesDescription(this.props.suggestion.blockType);
        const space = blockStyleDescription !== '' ? ' ' : '';

        let content;

        switch (this.props.suggestion.type) {
        case 'REPLACE_SUGGESTION':
            content = (
                <div>
                    <div>
                        <strong>{gettext('Replace')}: </strong>
                        {this.truncateText(oldText)}
                    </div>
                    <div>
                        <strong>{gettext('with')}: </strong>
                        {this.truncateText(suggestionText)}
                    </div>
                </div>
            );
            break;

        case 'CHANGE_LINK_SUGGESTION':
            content = (
                <div>
                    <div>
                        <strong>{gettext('Replace link')}: </strong>
                        {get(this.props.suggestion, 'from.href', '')}
                    </div>
                    <div>
                        <strong>{gettext('with')}: </strong>
                        {get(this.props.suggestion, 'to.href', '')}
                    </div>
                </div>
            );
            break;

        default:
            content = (
                <div>
                    <strong>{gettext(description) + space + gettext(blockStyleDescription)}: </strong>
                    {this.truncateText(suggestionText)}
                </div>
            );
        }

        return (
            <HighlightsPopupPresentation
                editorNode={this.props.editorNode}
                isRoot={true}
                header={(
                    <div>
                        <UserAvatar displayName={author.display_name} pictureUrl={author.picture_url} />
                        <p className="editor-popup__author-name">{author.display_name}</p>
                        <time className="editor-popup__time" title={relativeDateString}>{absoluteDateString}</time>
                    </div>
                )}
                availableActions={[]}
                content={null}
                scrollableContent={(
                    <div style={{background: '#fff', padding: '1.6rem', paddingBottom: '1rem'}}>
                        {content}
                    </div>
                )}
                stickyFooter={(
                    <div>
                        <button className="btn btn--small btn--hollow" onClick={this.onAccept}>
                            {gettext('Accept')}
                        </button>
                        <button className="btn btn--small btn--hollow" onClick={this.onReject}>
                            {gettext('Reject')}
                        </button>
                    </div>
                )}
            />
        );
    }
}

Suggestion.propTypes = {
    suggestion: PropTypes.shape({
        author: PropTypes.string,
        date: PropTypes.any,
        suggestionText: PropTypes.string,
        oldText: PropTypes.string,
        type: PropTypes.string,
        blockType: PropTypes.string,
        selection: PropTypes.object,
    }),
    acceptSuggestion: PropTypes.func,
    rejectSuggestion: PropTypes.func,
    editorNode: PropTypes.object,
};

export const SuggestionPopup: React.StatelessComponent<any> = connect(null, {
    acceptSuggestion,
    rejectSuggestion,
})(Suggestion);
