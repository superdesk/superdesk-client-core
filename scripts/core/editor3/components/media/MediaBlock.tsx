import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import ng from 'core/services/ng';
import * as actions from '../../actions';
import Textarea from 'react-textarea-autosize';
import {get} from 'lodash';
import {gettext} from 'core/utils';

function getTranslationForAssignRights(value) {
    if (value === 'single-usage') {
        return gettext('Single Usage');
    } else if (value === 'time-restricted') {
        return gettext('Time Restricted');
    } else if (value === 'indefinite-usage') {
        return gettext('Indefinite Usage');
    } else {
        return '';
    }
}

const DRAG_SCROLL_BUFFER = 150; // px
const DRAG_SCROLL_BY = 50; // px
const DRAG_SCROLL_TIMEOUT = 200; // ms

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name MediaBlockComponent
 * @param {Function} cropImage Dispatches the crop image action.
 * @param {Object} block Information about the block where this component renders.
 * @description This component renders an image block within the editor.
 */
export class MediaBlockComponent extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    container: any;
    scrollTimeout: any;

    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);
        this.onClickDelete = this.onClickDelete.bind(this);
        this.data = this.data.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDrag = this.onDrag.bind(this);
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
    onClick(tab) {
        const {block, cropImage, contentState} = this.props;
        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);
        const data = entity.getData();
        const isNew = false;
        const showMetadata = true;
        const defaultTab = tab;

        cropImage(entityKey, data, {isNew, showMetadata, defaultTab});
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

    componentDidMount() {
        this.container = document.getElementsByClassName('page-content-container')[0];
    }

    componentWillUnmount() {
        this.container = null;
    }

    onDrag(event) {
        let y = event.pageY;

        if (!this.scrollTimeout) {
            this.scrollTimeout = setTimeout(() => {
                // firefox does not provide pageY on drag event
                // so there is a window listener which populates the value
                // but it runs only after drag event so it must read it here
                if (!y && window['dragPageY']) {
                    y = window['dragPageY'];
                }

                if (y < DRAG_SCROLL_BUFFER) {
                    this.container.scrollTop -= DRAG_SCROLL_BY;
                } else if (y + DRAG_SCROLL_BUFFER > $(window).height()) {
                    this.container.scrollTop += DRAG_SCROLL_BY;
                }

                this.scrollTimeout = null;
            }, DRAG_SCROLL_TIMEOUT);
        }
    }

    render() {
        const {setLocked, showTitle, readOnly} = this.props;
        const data = this.data();
        const rendition = data.renditions.baseImage || data.renditions.viewImage || data.renditions.original;
        const alt = data.alt_text || data.description_text || data.caption;
        const mediaType = data.type;
        const {features} = ng.get('config');

        const editable =
            !readOnly && !data.fetch_endpoint &&
            (data._type !== 'externalsource'
            || get(features, 'editFeaturedImage', true));

        const removable = !readOnly;
        const draggable = removable;

        return (

            <div className="image-block"
                onClick={(e) => e.stopPropagation()}
                draggable={draggable} onDragStart={this.onDragStart} onDrag={this.onDrag}>
                {
                    removable && (
                        <a className="icn-btn image-block__remove" onClick={this.onClickDelete}>
                            <i className="icon-close-small" />
                        </a>
                    )
                }
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
                                <div className="image-block__metadata image-block__metadata--top-overlay">
                                    <span>
                                        <em>{gettext('Title:')}{' '}</em>
                                        {data.headline || gettext('[No Value]')}
                                    </span>
                                </div>
                                {
                                    editable && (
                                        <div className="image-block__icons-block">
                                            <a className="image-block__image-action"
                                                data-sd-tooltip={gettext('Edit metadata')}
                                                onClick={() => {
                                                    this.onClick('view');
                                                }}><i className="icon-pencil"/></a>
                                            <a className="image-block__image-action"
                                                data-sd-tooltip={gettext('Edit image')}
                                                onClick={() => {
                                                    this.onClick('image-edit');
                                                }}><i className="icon-switches"/></a>
                                            <a className="image-block__image-action"
                                                data-sd-tooltip={gettext('Edit crops')}
                                                onClick={() => {
                                                    this.onClick('crop');
                                                }}><i className="icon-crop"/></a>
                                        </div>
                                    )
                                }
                                <div className="image-block__metadata image-block__metadata--bottom-overlay">
                                    <span>
                                        <em>{gettext('Alt text:')}{' '}</em>
                                        {data.alt_text || gettext('[No Value]')}
                                    </span>
                                    <span>
                                        <em>{gettext('Credit:')}{' '}</em>
                                        {data.byline || gettext('[No Value]')}
                                    </span>
                                    <span>
                                        <em>{gettext('Copyright holder:')}{' '}</em>
                                        {data.copyrightholder || gettext('[No Value]')}
                                    </span>
                                    <span>
                                        <em>{gettext('Assign rights:')}{' '}</em>
                                        {
                                            getTranslationForAssignRights(data.usageterms)
                                            || gettext('[No Value]')
                                        }
                                    </span>
                                    <span>
                                        <em>{gettext('Copyright notice:')}{' '}</em>
                                        {data.copyrightnotice || gettext('[No Value]')}
                                    </span>
                                </div>

                            </div>
                            <img src={rendition.href} alt={alt} />
                        </div>
                    }
                    {mediaType === 'video' &&
                        <div>
                            {
                                showTitle === true ? null : (
                                    <Textarea
                                        placeholder={gettext('Title')}
                                        onFocus={setLocked}
                                        onClick={setLocked}
                                        className="image-block__title"
                                        value={data.headline}
                                        onChange={this.onChange}
                                    />
                                )
                            }
                            <video controls src={rendition.href} width="100%" height="100%" />
                            <div className="image-block__metadata image-block__metadata--side-marg0">
                                <span>
                                    <em>{gettext('Credit:')}{' '}</em>
                                    {data.byline || gettext('[No Value]')}
                                </span>
                                <span>
                                    <em>{gettext('Copyright holder:')}{' '}</em>
                                    {data.copyrightholder || gettext('[No Value]')}
                                </span>
                                <span>
                                    <em>{gettext('Assign rights:')}{' '}</em>
                                    {
                                        getTranslationForAssignRights(data.usageterms)
                                        || gettext('[No Value]')
                                    }
                                </span>
                                <span>
                                    <em>{gettext('Copyright notice:')}{' '}</em>
                                    {data.copyrightnotice || gettext('[No Value]')}
                                </span>
                            </div>
                        </div>
                    }
                    {mediaType === 'audio' &&
                        <div>
                            {
                                showTitle === true ? null : (
                                    <Textarea
                                        placeholder={gettext('Title')}
                                        onFocus={setLocked}
                                        onClick={setLocked}
                                        className="image-block__title"
                                        value={data.headline}
                                        onChange={this.onChange}
                                    />
                                )
                            }

                            <audio controls src={rendition.href} style={{width: '100%'}} />
                            <div className="image-block__metadata image-block__metadata--side-marg0">
                                <span>
                                    <em>{gettext('Credit:')}{' '}</em>
                                    {data.byline || gettext('[No Value]')}
                                </span>
                                <span>
                                    <em>{gettext('Copyright holder:')}{' '}</em>
                                    {data.copyrightholder || gettext('[No Value]')}
                                </span>
                                <span>
                                    <em>{gettext('Assign rights:')}{' '}</em>
                                    {
                                        getTranslationForAssignRights(data.usageterms)
                                            || gettext('[No Value]')
                                    }
                                </span>
                                <span>
                                    <em>{gettext('Copyright notice:')}{' '}</em>
                                    {data.copyrightnotice || gettext('[No Value]')}
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
                    {editable && (mediaType === 'audio' || mediaType === 'video') &&
                        <div className="image-block__action-bar">
                            <a className="btn btn--hollow btn--small"
                                onClick={this.onClick}><span>{gettext('Edit metadata')}</span></a>
                        </div>
                    }
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
    readOnly: PropTypes.bool,
    blockProps: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
    readOnly: state.readOnly,
    showTitle: state.showTitle,
});

const mapDispatchToProps = (dispatch) => ({
    cropImage: (entityKey, entityData, options) => dispatch(actions.cropImage(entityKey, entityData, options)),
    removeBlock: (blockKey) => dispatch(actions.removeBlock(blockKey)),
    changeCaption: (entityKey, newCaption, field) => dispatch(actions.changeImageCaption(entityKey, newCaption, field)),
    setLocked: () => dispatch(actions.setLocked(true)),
});

export const MediaBlock = connect(
    mapStateToProps,
    mapDispatchToProps,
)(MediaBlockComponent);
