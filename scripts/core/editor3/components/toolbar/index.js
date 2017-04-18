import React, {Component} from 'react';
import BlockStyleControls from './BlockStyleControls';
import InlineStyleControls from './InlineStyleControls';
import {LinkButton} from '../links';
import {ImageButton} from '../images';
import {EmbedButton} from '../embeds';
import {TableButton} from '../tables';
import classNames from 'classnames';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Toolbar
 * @param {Object} editorRect Position of editor on the screen (top, left).
 * @param {boolean} disabled Disables clicking on the toolbar, if true.
 * @description Holds the editor's toolbar.
 */
export default class Toolbar extends Component {
    render() {
        const {editorRect, disabled} = this.props;
        const cx = classNames({
            'Editor3-controls': true,
            disabled: disabled
        });

        return (
            <div className={cx}>
                <BlockStyleControls />
                <InlineStyleControls />
                <LinkButton editorRect={editorRect} />
                <ImageButton />
                <EmbedButton />
                <TableButton />
            </div>
        );
    }
}

Toolbar.propTypes = {
    editorRect: React.PropTypes.object.isRequired,
    disabled: React.PropTypes.bool
};
