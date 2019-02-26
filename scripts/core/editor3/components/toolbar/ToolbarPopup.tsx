import React from 'react';
import PropTypes from 'prop-types';
import {LinkInput} from '../links';
import {CommentInput} from '../comments';
import {AnnotationInput} from '../annotations';
import {EmbedInput} from '../embeds';
import {PopupTypes} from '../../actions';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @param {Function} onCancel
 * @param {PopupTypes} type Popup type.
 * @param {Object} data Metadata to pass to the pop-up (generally the SelectionState in the editor at
 * the time).
 * @description ToolbarPopupComponent renders the popup specified by the type property and passes it
 * the onCancel value along with the given prop data.
 */
export class ToolbarPopup extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    render() {
        const {type, data} = this.props;

        switch (type) {
        case PopupTypes.Annotation:
            return (
                <AnnotationInput
                    data={data}
                    editorState={this.props.editorState}
                    highlightsManager={this.props.highlightsManager}
                />
            );
        case PopupTypes.Comment:
            return <CommentInput data={data} highlightsManager={this.props.highlightsManager} />;
        case PopupTypes.Link:
            return <LinkInput data={data} />;
        case PopupTypes.Embed:
            return <EmbedInput />;
        }

        return null;
    }
}

ToolbarPopup.propTypes = {
    type: PropTypes.string,
    data: PropTypes.object,
    highlightsManager: PropTypes.object.isRequired,
    editorState: PropTypes.object.isRequired,
};
