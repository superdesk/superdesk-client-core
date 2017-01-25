import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import {Entity} from 'draft-js';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name ImageBlockComponent
 * @param {Function} cropImage Dispatches the crop image action.
 * @param {Object} block Information about the block where this component renders.
 * @description This component renders an image block within the editor.
 */
class ImageBlockComponent extends Component {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);
        this.href = this.href.bind(this);
    }

    /**
     * @ngdoc method
     * @name ImageBlockComponent#href
     * @returns {string} Hyperlink Reference
     * @description Returns the link to the image that this block is supposed to show.
     */
    href() {
        const {block} = this.props;
        const entityKey = block.getEntityAt(0);
        const entity = Entity.get(entityKey);
        const {img} = entity.getData();

        return img.renditions.original.href;
    }

    /**
     * @ngdoc method
     * @name ImageBlockComponent#onClick
     * @description Handles clicking on the image event. Dispatches the crop image
     * action.
     */
    onClick() {
        const {block, cropImage} = this.props;
        const entityKey = block.getEntityAt(0);

        cropImage(entityKey);
    }

    render() {
        return <img src={this.href()} onClick={this.onClick} />;
    }
}

ImageBlockComponent.propTypes = {
    cropImage: React.PropTypes.func.isRequired,
    block: React.PropTypes.object.isRequired
};

const mapDispatchToProps = (dispatch) => ({
    cropImage: (entityKey) => dispatch(actions.cropImage(entityKey))
});

const ImageBlock = connect(null, mapDispatchToProps)(ImageBlockComponent);

export default ImageBlock;
