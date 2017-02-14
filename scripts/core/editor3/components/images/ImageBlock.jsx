import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as actions from '../../actions';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name ImageBlockComponent
 * @param {Function} cropImage Dispatches the crop image action.
 * @param {Object} block Information about the block where this component renders.
 * @description This component renders an image block within the editor.
 */
export class ImageBlockComponent extends Component {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);
        this.data = this.data.bind(this);
    }

    /**
     * @ngdoc method
     * @name ImageBlockComponent#data
     * @returns {Object} Image data
     * @description Returns the image data.
     */
    data() {
        const {block, contentState} = this.props;
        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);
        const {img} = entity.getData();

        return img;
    }

    /**
     * @ngdoc method
     * @name ImageBlockComponent#onClick
     * @description Handles clicking on the image event. Dispatches the crop image
     * action.
     */
    onClick() {
        const {block, cropImage, contentState} = this.props;
        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);

        cropImage(entityKey, entity.getData());
    }

    render() {
        const data = this.data();
        const href = data.renditions.original.href;
        const alt = data.alt_text;
        const description = data.description_text;

        return (
            <div className="image-block">
                <div className="image-block__wrapper">
                    <img src={href} alt={alt} onClick={this.onClick} />
                    <div className="image-block__description">{description}</div>
                </div>
            </div>
        );
    }
}

ImageBlockComponent.propTypes = {
    cropImage: React.PropTypes.func.isRequired,
    block: React.PropTypes.object.isRequired,
    contentState: React.PropTypes.object.isRequired
};

const mapDispatchToProps = (dispatch) => ({
    cropImage: (entityKey, entityData) => dispatch(actions.cropImage(entityKey, entityData))
});

export const ImageBlock = connect(null, mapDispatchToProps)(ImageBlockComponent);
