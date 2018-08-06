import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Textarea from 'react-textarea-autosize';
import {connect} from 'react-redux';
import {QumuWidget, isQumuWidget} from './QumuWidget';
import * as actions from '../../actions';
import ng from 'core/services/ng';

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
        this.editEmbedHtml = this.editEmbedHtml.bind(this);
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

    getEntityKey() {
        const {block} = this.props;

        return block.getEntityAt(0);
    }

    getBlockKey() {
        const {block} = this.props;

        return block.getKey();
    }

    onChangeDescription(event) {
        const entityKey = this.getEntityKey();
        const blockKey = this.getBlockKey();

        this.props.mergeEntityDataByKey(blockKey, entityKey, {
            description: event.target.value,
        });
    }

    editEmbedHtml() {
        const embed = this.data();
        const entityKey = this.getEntityKey();
        const blockKey = this.getBlockKey();
        const modal = ng.get('modal');

        modal.prompt(gettext('Edit embed'), embed.data.html)
            .then((html) => {
                this.props.mergeEntityDataByKey(blockKey, entityKey, {
                    data: {...embed.data, html},
                });
            });
    }

    data() {
        const {contentState} = this.props;
        const entityKey = this.getEntityKey();
        const entity = contentState.getEntity(entityKey);

        return entity.getData();
    }

    shouldComponentUpdate(nextProps) {
        const {contentState} = nextProps;
        const entityKey = this.getEntityKey();
        const entity = contentState.getEntity(entityKey);
        const {data} = entity.getData();
        const oldData = this.data();

        return data.html !== oldData.html;
    }

    onClickDelete() {
        const {block, removeBlock} = this.props;

        removeBlock(block.getKey());
    }

    render() {
        const embed = this.data();
        const html = embed.data.html;
        const isQumu = isQumuWidget(html);

        if (isQumu !== true) {
            this.runScripts(html);
        }

        return (
            <div className="embed-block">
                <a className="icn-btn embed-block__remove" onMouseDown={this.onClickDelete}>
                    <i className="icon-close-small" />
                </a>
                <a className="icn-btn embed-block__edit" onMouseDown={this.editEmbedHtml}>
                    <i className="icon-pencil" />
                </a>

                {
                    isQumu
                        ? <QumuWidget html={html} />
                        : <div className="embed-block__wrapper" dangerouslySetInnerHTML={{__html: html}} />
                }

                <Textarea
                    placeholder={gettext('Description')}
                    onFocus={this.props.setLocked}
                    onClick={this.props.setLocked}
                    className="image-block__description"
                    value={embed.description || ''}
                    onChange={this.onChangeDescription}
                />
            </div>
        );
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
    mergeEntityDataByKey: (blockKey, entityKey, valuesToMerge) =>
        dispatch(actions.mergeEntityDataByKey(blockKey, entityKey, valuesToMerge)),
});

export const EmbedBlock = connect(null, mapDispatchToProps)(EmbedBlockComponent);