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
        const {className} = this.props;
        const divProps = Object.assign({}, this.props);

        // avoid react unknown prop warning
        delete divProps.dispatch;
        delete divProps.className;

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
    dispatch: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default connect()(UnstyledBlock);
