import React from 'react';
import PropTypes from 'prop-types';
import {omit} from 'lodash';
import {connect} from 'react-redux';

import BaseUnstyledComponent from './BaseUnstyledComponent';

/**
 * This block is used by default for text content in editor.
 *
 * It handles drag events and lets editor blocks to be dropped on it.
 * There is dropzone indication after the text and on drop it will put
 * atom block after current block.
 */
class UnstyledBlock extends BaseUnstyledComponent {
    constructor(props) {
        super(props);
        this.dropInsertionMode = 'after';
    }

    getDropBlockKey() {
        return this.props.children.key;
    }

    render() {
        let {className} = this.props;

        const propsToTransfer = omit(this.props, ['className', 'invisibles', 'dispatch', 'editorProps']);

        return (
            <div ref={(div) => this.div = div}
                {...propsToTransfer}
                className={className + (this.state.over ? ' unstyled__block--over' : ' unstyled__block')}
            >
                {this.props.children}
            </div>
        );
    }
}

UnstyledBlock.propTypes = {
    children: PropTypes.object,
    className: PropTypes.string,
    editorProps: PropTypes.object,
};

// mapping state to props in `connect` might not work well for this component
// it was removed to fix SDESK-2886
export default UnstyledBlock;
