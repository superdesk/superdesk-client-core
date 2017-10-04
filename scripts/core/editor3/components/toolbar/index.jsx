import React, {Component} from 'react';
import PropTypes from 'prop-types';
import BlockStyleControls from './BlockStyleControls';
import InlineStyleControls from './InlineStyleControls';
import TableControls from './TableControls';
import {LinkButton} from '../links';
import {LinkInput} from '../links';
import {ImageButton} from '../images';
import {EmbedButton} from '../embeds';
import {TableButton} from '../tables';
import {connect} from 'react-redux';
import {LinkToolbar} from '../links';
import classNames from 'classnames';
import * as actions from '../../actions';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Toolbar
 * @param {boolean} disabled Disables clicking on the toolbar, if true.
 * @description Holds the editor's toolbar.
 */
class ToolbarComponent extends Component {
    constructor(props) {
        super(props);

        this.showInput = this.showInput.bind(this);
        this.hideInput = this.hideInput.bind(this);

        this.state = {inputLabel: null};
    }

    /**
     * @ngdoc method
     * @name Toolbar#hideInput
     * @description Hides the link input.
     */
    hideInput() {
        this.setState({inputLabel: null});
    }

    /**
     * @ngdoc method
     * @name Toolbar#showInput
     * @param {Event} e
     * @param {Object} link object to edit
     * existing link.
     * @description Shows the link input box.
     */
    showInput(link) {
        const isNewLink = !link;
        const isCollapsed = this.props.editorState.getSelection().isCollapsed();

        // only add new links if there is a selection
        if (isNewLink && isCollapsed) {
            return;
        }

        this.setState({inputLabel: link});
    }

    render() {
        const {
            disabled,
            editorFormat,
            activeCell,
            applyLink,
            editorState
        } = this.props;

        const has = (opt) => editorFormat.indexOf(opt) > -1;
        const isEditing = this.state.inputLabel !== null;

        const cx = classNames({
            'Editor3-controls': true,
            disabled: disabled
        });

        return activeCell !== null ? <TableControls /> :
            <div className={cx}>
                <BlockStyleControls />
                <InlineStyleControls />
                {has('anchor') ? <LinkButton onClick={this.showInput} /> : null}
                {has('picture') ? <ImageButton /> : null}
                {has('embed') ? <EmbedButton /> : null}
                {has('table') ? <TableButton /> : null}
                {!isEditing ? <LinkToolbar onEdit={this.showInput} /> :
                    <LinkInput
                        editorState={editorState}
                        onSubmit={applyLink}
                        onCancel={this.hideInput}
                        value={this.state.inputLabel} />}
            </div>;
    }
}

ToolbarComponent.propTypes = {
    disabled: PropTypes.bool,
    editorFormat: PropTypes.array,
    activeCell: PropTypes.any,
    applyLink: PropTypes.func,
    editorState: PropTypes.object
};

const mapStateToProps = (state) => ({
    editorFormat: state.editorFormat,
    editorState: state.editorState,
    activeCell: state.activeCell
});

const mapDispatchToProps = (dispatch) => ({
    applyLink: (link, entity = null) => dispatch(actions.applyLink({link, entity}))
});

const Toolbar = connect(mapStateToProps, mapDispatchToProps)(ToolbarComponent);

export default Toolbar;
