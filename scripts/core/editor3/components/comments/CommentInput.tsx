import React from 'react';
import PropTypes from 'prop-types';
import {Dropdown} from 'core/ui/components';
import {connect} from 'react-redux';
import {getAuthorInfo, hidePopups} from '../../actions';
import CommentTextArea from './CommentTextArea';
import {getHighlightsConfig} from '../../highlightsConfig';
import {gettext} from 'core/utils';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name CommentInputBody
 * @param {Function} hidePopups
 * @description CommentInputBody holds the dropdown that is used to enter the text for a
 * comment.
 */
class CommentInputBody extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.state = {msg: props.data.msg || ''};
        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onCancel = this.onCancel.bind(this);
    }

    /**
     * @ngdoc method
     * @name CommentInputBody#onSubmit
     * @description onSubmit is called when the user clicks the Submit button in the UI.
     * Consequently, it calls the `onSubmit` prop, passing it the value of the text input.
     */
    onSubmit() {
        const {msg} = this.state;
        const {highlightId} = this.props.data;

        if (msg !== '') {
            if (highlightId === undefined) {
                this.props.highlightsManager.addHighlight(
                    getHighlightsConfig().COMMENT.type,
                    {
                        data: {
                            msg: msg,
                            replies: [],
                            resolutionInfo: null,
                            ...getAuthorInfo(),
                        },
                    },
                );
            } else {
                const highlightData = this.props.highlightsManager.getHighlightData(highlightId);
                const date = new Date();

                this.props.highlightsManager.updateHighlightData(
                    highlightId,
                    {...highlightData, data: {...highlightData.data, msg, date}},
                );
            }
            this.props.hidePopups();
        }
    }

    onCancel(_ev) {
        this.props.hidePopups();
    }

    /**
     * @ngdoc method
     * @name CommentInputBody#onChange
     * @description onChange is triggered when the Textarea content changes.
     */
    onChange(ev, value) {
        this.setState({msg: value});
    }

    render() {
        const {msg} = this.state;

        return (
            <div className="comment-input">
                <Dropdown open={true}>
                    <CommentTextArea
                        value={msg}
                        onChange={this.onChange}
                    />
                    <div className="pull-right" style={{paddingTop: 20}}>
                        <button className="btn btn--cancel" onClick={(ev) => this.onCancel(ev)}>
                            {gettext('Cancel')}
                        </button>
                        <button className="btn btn--primary" onClick={this.onSubmit} disabled={!msg}>
                            {gettext('Submit')}
                        </button>
                    </div>
                </Dropdown>
            </div>
        );
    }
}

CommentInputBody.propTypes = {
    hidePopups: PropTypes.func,
    data: PropTypes.object,
    highlightsManager: PropTypes.object.isRequired,
};

export const CommentInput = connect(null, {
    hidePopups,
})(CommentInputBody);
