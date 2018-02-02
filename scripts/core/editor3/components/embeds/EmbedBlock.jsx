import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {QumuWidget} from './QumuWidget';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name EmbedBlock
 * @param {Object} block Information about the block where this component renders.
 * @description This component renders an embed block within the editor, using oEmbed data
 * retrieved from iframe.ly
 */
export class EmbedBlock extends Component {
    /**
     * @name EmbedBlock#runScripts
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

    data() {
        const {block, contentState} = this.props;
        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);
        const {data} = entity.getData();

        return data;
    }

    shouldComponentUpdate(nextProps) {
        const {block, contentState} = nextProps;
        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);
        const {data} = entity.getData();
        const oldData = this.data();

        return data.html !== oldData.html;
    }

    embedBlock({html}) {
        this.runScripts(html);

        return <div className="embed-block" dangerouslySetInnerHTML={{__html: html}} />;
    }

    render() {
        const data = this.data();

        return data.qumuWidget
            ? <QumuWidget code={data} />
            : this.embedBlock(data);
    }
}

EmbedBlock.propTypes = {
    block: PropTypes.object.isRequired,
    contentState: PropTypes.object.isRequired
};
