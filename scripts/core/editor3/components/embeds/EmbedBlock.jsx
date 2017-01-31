import React, {Component} from 'react';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name EmbedBlock
 * @param {Object} block Information about the block where this component renders.
 * @description This component renders an embed block within the editor, using oEmbed data
 * retrieved from iframe.ly
 */
export default class EmbedBlock extends Component {
    render() {
        const {block, contentState} = this.props;
        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);
        const {data} = entity.getData();

        return (
            <div className="embed-block" dangerouslySetInnerHTML={{__html: data.html}} />
        );
    }
}

EmbedBlock.propTypes = {
    block: React.PropTypes.object.isRequired,
    contentState: React.PropTypes.object.isRequired
};
