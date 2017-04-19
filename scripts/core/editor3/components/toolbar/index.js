import React, {Component} from 'react';
import BlockStyleControls from './BlockStyleControls';
import InlineStyleControls from './InlineStyleControls';
import {LinkButton} from '../links';
import {ImageButton} from '../images';
import {EmbedButton} from '../embeds';
import {TableButton} from '../tables';
import {connect} from 'react-redux';
import classNames from 'classnames';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Toolbar
 * @param {Object} editorRect Position of editor on the screen (top, left).
 * @param {boolean} disabled Disables clicking on the toolbar, if true.
 * @description Holds the editor's toolbar.
 */
class ToolbarComponent extends Component {
    render() {
        const {editorRect, disabled, editorFormat} = this.props;
        const has = (opt) => editorFormat.indexOf(opt) > -1;
        const cx = classNames({
            'Editor3-controls': true,
            disabled: disabled
        });

        return (
            <div className={cx}>
                <BlockStyleControls />
                <InlineStyleControls />
                {has('anchor') ? <LinkButton editorRect={editorRect} /> : null}
                {has('picture') ? <ImageButton /> : null}
                {has('embed') ? <EmbedButton /> : null}
                {has('table') ? <TableButton /> : null}
            </div>
        );
    }
}

ToolbarComponent.propTypes = {
    editorRect: React.PropTypes.object.isRequired,
    disabled: React.PropTypes.bool,
    editorFormat: React.PropTypes.array
};

const mapStateToProps = (state) => ({editorFormat: state.editorFormat});

const Toolbar = connect(mapStateToProps, null)(ToolbarComponent);

export default Toolbar;
