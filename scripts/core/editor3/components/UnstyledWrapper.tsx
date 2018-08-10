import React from 'react';
import PropTypes from 'prop-types';
import BaseUnstyledComponent from './BaseUnstyledComponent';

/**
 * Custom wrapper for draft unstyled blocks.
 *
 * It allows moving block above existing blocks, adding a dropzone
 * above first unstyled block.
 */
class UnstyledWrapper extends BaseUnstyledComponent {
    getDropBlockKey: any;

    constructor(props) {
        super(props);
        this.dropInsertionMode = 'before';
        this.getDropBlockKey = () => this.props.children[0].key;
    }

    render() {
        const className = 'unstyled ' + (this.state.over ? 'unstyled--over' : '');

        return (
            <div className={className} ref={(div) => this.div = div}>
                {this.props.children}
            </div>
        );
    }
}

UnstyledWrapper.propTypes = {
    dispatch: PropTypes.func.isRequired,
    children: PropTypes.array,
};

export default UnstyledWrapper;
