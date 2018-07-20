import React from 'react';
import PropTypes from 'prop-types';
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
        const divProps = Object.assign({}, this.props);

        // avoid react unknown prop warning
        delete divProps.className;
        delete divProps.invisibles;
        delete divProps.dispatch;
        delete divProps.editorProps;

        return (
            <div ref={(div) => this.div = div}
                {...divProps}
                className={className + (this.state.over ? ' unstyled__block--over' : ' unstyled__block')}
            >
                {divProps.children}
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
// still, we need `connect` to get dispatch as a prop
const Unstyled = connect()(UnstyledBlock);

export default Unstyled;
