import React from 'react';
import PropTypes from 'prop-types';

import {getValidMediaType, canDropMedia, dragEventShouldShowDropZone} from './Editor3Component';
import {moveBlock, dragDrop, embed} from '../actions/editor3';
import {getEmbedObject} from './embeds/EmbedInput';
import {htmlComesFromDraftjsEditor} from 'core/editor3/helpers/htmlComesFromDraftjsEditor';
import {htmlIsPlainTextDragged} from 'core/editor3/helpers/htmlIsPlainTextDragged';

const EDITOR_BLOCK_TYPE = 'superdesk/editor3-block';

export function isEditorBlockEvent(event) {
    return event.originalEvent.dataTransfer.types.indexOf(EDITOR_BLOCK_TYPE) > -1;
}

export function getEditorBlock(event) {
    return event.originalEvent.dataTransfer.getData(EDITOR_BLOCK_TYPE);
}

function embedShouldBeCreated(html, editorProps): boolean {
    if (!editorProps.editorFormat.includes('embed')) {
        return false;
    }

    const comingFromDraftJS = htmlComesFromDraftjsEditor(html);
    const shouldEmbedBeCreated = comingFromDraftJS ? false : !htmlIsPlainTextDragged(html);

    return shouldEmbedBeCreated;
}

function isHtmlTextAndShouldCreateEmbed(event, mediaType, editorProps): boolean {
    if (mediaType !== 'text/html') {
        return false;
    }

    const html = event.originalEvent.dataTransfer.getData(mediaType);

    return embedShouldBeCreated(html, editorProps);
}

interface IProps {
    dispatch(action: any);
    editorProps: any;
    className?: string;
}

interface IState {
    over: boolean;
}

class BaseUnstyledComponent extends React.Component<IProps, IState> {
    static propTypes: any;
    static defaultProps: any;

    getDropBlockKey: any;
    dropInsertionMode: any;
    leaveTimeout: any;
    div: any;

    constructor(props) {
        super(props);
        this.onDrop = this.onDrop.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.state = {over: false};
    }

    onDrop(event) {
        this.setState({over: false});

        let handled = false;
        const block = getEditorBlock(event);

        if (typeof block === 'string' && block.length > 0) {
            // existing media item dropped to another place
            this.props.dispatch(moveBlock(block, this.getDropBlockKey(), this.dropInsertionMode));
            handled = true;
            return;
        }

        const {dataTransfer} = event.originalEvent;
        const mediaType = getValidMediaType(event.originalEvent);
        const blockKey = this.getDropBlockKey();
        const link = event.originalEvent.dataTransfer.getData('URL');

        if (canDropMedia(event, this.props.editorProps)
            && (mediaType === 'Files' || mediaType.includes('application/superdesk'))) {
            this.props.dispatch(dragDrop(dataTransfer, mediaType, blockKey));
            handled = true;
        } else if (
            typeof link === 'string'
            && link.startsWith('http')
            && this.props.editorProps.editorFormat.includes('embed')
        ) {
            getEmbedObject(link)
                .then((oEmbed) => {
                    this.props.dispatch(embed(oEmbed, blockKey));
                });
            handled = true;
        } else if (isHtmlTextAndShouldCreateEmbed(event, mediaType, this.props.editorProps)) {
            this.props.dispatch(embed(event.originalEvent.dataTransfer.getData(mediaType), blockKey));
            handled = true;
        } else {
            console.warn('unsupported media type on drop', mediaType);
        }

        if (handled) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    onDragOver(event) {
        if (!dragEventShouldShowDropZone(event.originalEvent)) {
            return;
        }

        if (this.leaveTimeout) {
            clearTimeout(this.leaveTimeout);
            this.leaveTimeout = null;
        }

        event.preventDefault();
        event.stopPropagation();
        this.setState({over: true});
    }

    onDragLeave(event) {
        if (!dragEventShouldShowDropZone(event.originalEvent)) {
            return;
        }

        event.stopPropagation();
        if (this.state.over && !this.leaveTimeout) {
            this.leaveTimeout = setTimeout(() => {
                this.setState({over: false});
                this.leaveTimeout = null;
            }, 50); // avoid placeholder flickering
        }
    }

    componentDidMount() {
        $(this.div).on('drop', this.onDrop);
        $(this.div).on('dragleave', this.onDragLeave);
        $(this.div).on('dragover dragenter', this.onDragOver);
    }

    componentWillUnmount() {
        $(this.div).off();
    }
}

export default BaseUnstyledComponent;
