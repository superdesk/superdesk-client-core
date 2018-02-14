import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import Textarea from 'react-textarea-autosize';

function getTranslationForAssignRights(value, gettextCatalog) {
    if (value === 'single-usage') {
        return gettextCatalog.getString('Single Usage');
    } else if (value === 'time-restricted') {
        return gettextCatalog.getString('Time Restricted');
    } else if (value === 'indefinite-usage') {
        return gettextCatalog.getString('Indefinite Usage');
    } else {
        return '';
    }
}

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
        this.onClickDelete = this.onClickDelete.bind(this);
        this.data = this.data.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
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
     * @name MediaBlockComponent#onClickDelete
     * @description Handles clicking on the delete button. Dispatches the
     * remove block action.
     */
    onClickDelete() {
        const {block, removeBlock} = this.props;

        removeBlock(block.getKey());
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
    }

    onDragStart(event) {
        event.dataTransfer.setData('superdesk/editor3-block', this.props.block.getKey());
    }

    render() {
        const {setLocked, showTitle} = this.props;
        const data = this.data();
        const rendition = data.renditions.viewImage || data.renditions.original;
        const alt = data.alt_text || data.description_text || data.caption;
        const mediaType = data.type;

        var {gettextCatalog} = this.props.blockProps.svc;

        return (

            <div className="image-block"
                onClick={(e) => e.stopPropagation()}
                draggable={true} onDragStart={this.onDragStart}>
                <a className="icn-btn image-block__remove" onClick={this.onClickDelete}>
                    <i className="icon-close-small" />
                </a>
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
                        <div className="image-block__image">
                            <div className="image-block__image-overlay">
                                <div className="image-block__metadata image-block__metadata--top">
                                    <span>
                                        <em>{gettextCatalog.getString('Title:')}{' '}</em>
                                        {data.headline || gettextCatalog.getString('[No Value]')}
                                    </span>
                                </div>
                                <div className="image-block__icons-block">
                                    <a className="image-block__image-edit"
                                        onClick={this.onClick}><i className="icon-pencil"/></a>
                                </div>
                                <div className="image-block__metadata">
                                    <span>
                                        <em>{gettextCatalog.getString('Alt text:')}{' '}</em>
                                        {data.alt_text || gettextCatalog.getString('[No Value]')}
                                    </span>
                                    <span>
                                        <em>{gettextCatalog.getString('Credit:')}{' '}</em>
                                        {data.byline || gettextCatalog.getString('[No Value]')}
                                    </span>
                                    <span>
                                        <em>{gettextCatalog.getString('Copyright holder:')}{' '}</em>
                                        {data.copyrightholder || gettextCatalog.getString('[No Value]')}
                                    </span>
                                    <span>
                                        <em>{gettextCatalog.getString('Assign rights:')}{' '}</em>
                                        {
                                            getTranslationForAssignRights(data.usageterms, gettextCatalog)
                                            || gettextCatalog.getString('[No Value]')
                                        }
                                    </span>
                                    <span>
                                        <em>{gettextCatalog.getString('Copyright notice:')}{' '}</em>
                                        {data.copyrightnotice || gettextCatalog.getString('[No Value]')}
                                    </span>
                                </div>

                            </div>
                            <img src={rendition.href} alt={alt} />
                        </div>
                    }
                    {mediaType === 'video' &&
                        <div className="image-block__image">
                            <div className="image-block__image-overlay image-block__image-overlay--video">
                                <div className="image-block__metadata image-block__metadata--top">
                                    <span>
                                        <em>{gettextCatalog.getString('Title:')}{' '}</em>
                                        {data.headline || gettextCatalog.getString('[No Value]')}
                                    </span>
                                </div>
                                <div className="image-block__icons-block" />
                                <div className="image-block__metadata">
                                    <span>
                                        <em>{gettextCatalog.getString('Alt text:')}{' '}</em>
                                        {data.alt_text || gettextCatalog.getString('[No Value]')}
                                    </span>
                                    <span>
                                        <em>{gettextCatalog.getString('Credit:')}{' '}</em>
                                        {data.byline || gettextCatalog.getString('[No Value]')}
                                    </span>
                                    <span>
                                        <em>{gettextCatalog.getString('Copyright holder:')}{' '}</em>
                                        {data.copyrightholder || gettextCatalog.getString('[No Value]')}
                                    </span>
                                    <span>
                                        <em>{gettextCatalog.getString('Assign rights:')}{' '}</em>
                                        {
                                            getTranslationForAssignRights(data.usageterms, gettextCatalog)
                                            || gettextCatalog.getString('[No Value]')
                                        }
                                    </span>
                                    <span>
                                        <em>{gettextCatalog.getString('Copyright notice:')}{' '}</em>
                                        {data.copyrightnotice || gettextCatalog.getString('[No Value]')}
                                    </span>
                                </div>
                            </div>
                            <video controls src={rendition.href} alt={alt} width="100%" height="100%" />
                        </div>
                    }
                    {mediaType === 'audio' &&
                        <div>
                            <audio controls src={rendition.href} alt={alt} width="100%" height="100%" />

                            <div className="image-block__metadata image-block__metadata--plain">
                                <span>
                                    <em>{gettextCatalog.getString('Credit:')}{' '}</em>
                                    {data.byline || gettextCatalog.getString('[No Value]')}
                                </span>
                                <span>
                                    <em>{gettextCatalog.getString('Copyright holder:')}{' '}</em>
                                    {data.copyrightholder || gettextCatalog.getString('[No Value]')}
                                </span>
                                <span>
                                    <em>{gettextCatalog.getString('Assign rights:')}{' '}</em>
                                    {
                                        getTranslationForAssignRights(data.usageterms, gettextCatalog)
                                            || gettextCatalog.getString('[No Value]')
                                    }
                                </span>
                                <span>
                                    <em>{gettextCatalog.getString('Copyright notice:')}{' '}</em>
                                    {data.copyrightnotice || gettextCatalog.getString('[No Value]')}
                                </span>
                            </div>
                        </div>

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
    removeBlock: PropTypes.func.isRequired,
    changeCaption: PropTypes.func.isRequired,
    setLocked: PropTypes.func.isRequired,
    block: PropTypes.object.isRequired,
    contentState: PropTypes.object.isRequired,
    showTitle: PropTypes.bool,
    blockProps: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
    showTitle: state.showTitle
});

const mapDispatchToProps = (dispatch) => ({
    cropImage: (entityKey, entityData) => dispatch(actions.cropImage(entityKey, entityData)),
    removeBlock: (blockKey) => dispatch(actions.removeBlock(blockKey)),
    changeCaption: (entityKey, newCaption, field) => dispatch(actions.changeImageCaption(entityKey, newCaption, field)),
    setLocked: () => dispatch(actions.setLocked(true))
});

export const MediaBlock = connect(mapStateToProps, mapDispatchToProps)(MediaBlockComponent);
