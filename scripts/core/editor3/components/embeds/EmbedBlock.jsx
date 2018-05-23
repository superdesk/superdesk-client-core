import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Textarea from 'react-textarea-autosize';
import {connect} from 'react-redux';
import {QumuWidget} from './QumuWidget';
import * as actions from '../../actions';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name EmbedBlockComponent
 * @param {Object} block Information about the block where this component renders.
 * @description This component renders an embed block within the editor, using oEmbed data
 * retrieved from iframe.ly
 */
export class EmbedBlockComponent extends Component {
    constructor(props) {
        super(props);

        this.onClickDelete = this.onClickDelete.bind(this);
        this.onChangeDescription = this.onChangeDescription.bind(this);
    }

    /**
     * @name EmbedBlockComponent#runScripts
     * @param {string} html
     * @description Runs and imports all the scripts in the given HTML.
     */
    runScripts(html) {
        const tree = $('<div />').html(html);

        tree.find('script').each((i, s) => {
            if (s.hasAttribute('src')) {
                let url = s.getAttribute('src');
                let async = s.hasAttribute('async');

                if (url.startsWith('http')) {
                    url = url.substring(url.indexOf(':') + 1);
                }

                return $.ajax({url: url, async: async, dataType: 'script'});
            }

            try {
                // eslint-disable-next-line no-eval
                eval(s.innerHTML);
            } catch (e) {
                /* carry on */
            }
        });
    }

    onChangeDescription(event) {
        const {block} = this.props;
        const entityKey = block.getEntityAt(0);

        this.props.mergeEntityDataByKey(entityKey, {
            description: event.target.value,
        });
    }

    data() {
        const {block, contentState} = this.props;
        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);

        return entity.getData();
    }

    shouldComponentUpdate(nextProps) {
        const {block, contentState} = nextProps;
        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);
        const {data} = entity.getData();
        const oldData = this.data();

        return data.html !== oldData.html;
    }

    onClickDelete() {
        const {block, removeBlock} = this.props;

        removeBlock(block.getKey());
    }

    embedBlock(embed) {
        const html = embed.data.html;

        this.runScripts(html);
        return <div className="embed-block">
            <a className="icn-btn embed-block__remove" onClick={this.onClickDelete}>
                <i className="icon-close-small" />
            </a>
            <div className="embed-block__wrapper" dangerouslySetInnerHTML={{__html: html}} />

            <Textarea
                placeholder={gettext('Description')}
                onFocus={this.props.setLocked}
                onClick={this.props.setLocked}
                className="image-block__description"
                value={embed.description || ''}
                onChange={this.onChangeDescription}
            />
        </div>;
    }

    render() {
        const embed = this.data();
        const {data} = embed;

        return data.qumuWidget
            ? <QumuWidget code={data} />
            : this.embedBlock(embed);
    }
}

EmbedBlockComponent.propTypes = {
    block: PropTypes.object.isRequired,
    contentState: PropTypes.object.isRequired,
    removeBlock: PropTypes.func.isRequired,
    mergeEntityDataByKey: PropTypes.func.isRequired,
    setLocked: PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
    removeBlock: (blockKey) => dispatch(actions.removeBlock(blockKey)),
    setLocked: () => dispatch(actions.setLocked(true)),
    mergeEntityDataByKey: (entityKey, valuesToMerge) =>
        dispatch(actions.mergeEntityDataByKey(entityKey, valuesToMerge)),
});

export const EmbedBlock = connect(null, mapDispatchToProps)(EmbedBlockComponent);