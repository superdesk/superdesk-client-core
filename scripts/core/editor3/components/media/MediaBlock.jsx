import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import Textarea from 'react-textarea-autosize';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name MediaBlockComponent
 * @param {Function} cropImage Dispatches the crop image action.
 * @param {Object} block Information about the block where this component renders.
 * @description This component renders an image block within the editor.
 */
export class MediaBlockComponent extends Component {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);
        this.data = this.data.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    /**
     * @ngdoc method
     * @name MediaBlockComponent#data
     * @returns {Object} Image data
     * @description Returns the image data.
     */
    data() {
        const {block, contentState} = this.props;
        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);
        const {media} = entity.getData();

        return media;
    }

    /**
     * @ngdoc method
     * @name MediaBlockComponent#onClick
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
     * @name MediaBlockComponent#onChange
     * @description Triggered (debounced) when the image caption input is edited.
     */
    onChange({target}) {
        const {block, changeCaption} = this.props;
        const entityKey = block.getEntityAt(0);

        changeCaption(entityKey, target.value, target.placeholder);
        this.forceUpdate();
    }

    render() {
        const {setLocked, showTitle} = this.props;
        const data = this.data();
        const rendition = data.renditions.viewImage || data.renditions.original;
        const alt = data.alt_text || data.description_text || data.caption;
        const mediaType = data.type;

        return (
            <div className="image-block" onClick={(e) => e.stopPropagation()}>
                <div className="image-block__wrapper">
                    {showTitle ?
                        <Textarea
                            placeholder={gettext('Title')}
                            onFocus={setLocked}
                            onClick={setLocked}
                            className="image-block__title"
                            value={data.headline}
                            onChange={this.onChange}
                        /> : null }
                    {mediaType === 'picture' &&
                        <img src={rendition.href} alt={alt} onClick={this.onClick} />
                    }
                    {mediaType === 'video' &&
                        <video controls src={rendition.href} alt={alt} width="100%" height="100%" />
                    }
                    {mediaType === 'audio' &&
                        <audio controls src={rendition.href} alt={alt} width="100%" height="100%" />
                    }
                    <Textarea
                        placeholder={gettext('Caption')}
                        onFocus={setLocked}
                        onClick={setLocked}
                        className="image-block__description"
                        value={data.description_text}
                        onChange={this.onChange}
                    />
                </div>
            </div>
        );
    }
}

MediaBlockComponent.propTypes = {
    cropImage: PropTypes.func.isRequired,
    changeCaption: PropTypes.func.isRequired,
    setLocked: PropTypes.func.isRequired,
    block: PropTypes.object.isRequired,
    contentState: PropTypes.object.isRequired,
    showTitle: PropTypes.bool
};

const mapStateToProps = (state) => ({
    showTitle: state.showTitle
});

const mapDispatchToProps = (dispatch) => ({
    cropImage: (entityKey, entityData) => dispatch(actions.cropImage(entityKey, entityData)),
    changeCaption: (entityKey, newCaption, field) => dispatch(actions.changeImageCaption(entityKey, newCaption, field)),
    setLocked: () => dispatch(actions.setLocked(true))
});

export const MediaBlock = connect(mapStateToProps, mapDispatchToProps)(MediaBlockComponent);
