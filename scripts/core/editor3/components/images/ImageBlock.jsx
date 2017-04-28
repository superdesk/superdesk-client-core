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
        this.onChange = this.onChange.bind(this);
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

    /**
     * @ngdoc method
     * @name ImageBlockComponent#onChange
     * @description Triggered (debounced) when the image caption input is edited.
     */
    onChange() {
        const {block, changeCaption} = this.props;
        const entityKey = block.getEntityAt(0);

        changeCaption(entityKey, this.captionInput.value);
    }

    render() {
        const {setReadOnly} = this.props;
        const data = this.data();
        const rendition = data.renditions.viewImage || data.renditions.original;
        const alt = data.alt_text || data.description_text || data.caption;

        return (
            <div className="image-block" onClick={(e) => e.stopPropagation()}>
                <div className="image-block__wrapper">
                    <img src={rendition.href} alt={alt} onClick={this.onClick} />
                    <input type="text" placeholder="Description"
                        ref={(el) => {
                            this.captionInput = el;
                        }}
                        onFocus={setReadOnly}
                        className="image-block__description"
                        defaultValue={data.description_text}
                        onChange={_.debounce(this.onChange, 500)} />
                </div>
            </div>
        );
    }
}

ImageBlockComponent.propTypes = {
    cropImage: React.PropTypes.func.isRequired,
    changeCaption: React.PropTypes.func.isRequired,
    setReadOnly: React.PropTypes.func.isRequired,
    block: React.PropTypes.object.isRequired,
    contentState: React.PropTypes.object.isRequired
};

const mapDispatchToProps = (dispatch) => ({
    cropImage: (entityKey, entityData) => dispatch(actions.cropImage(entityKey, entityData)),
    changeCaption: (entityKey, newCaption) => dispatch(actions.changeImageCaption(entityKey, newCaption)),
    setReadOnly: () => dispatch(actions.setReadOnly())
});

export const ImageBlock = connect(null, mapDispatchToProps)(ImageBlockComponent);
