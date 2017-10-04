import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../actions';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name ImageButton
 * @param {Function} insertImages Dispatches the insert images action.
 * @description This component renders the image button on the toolbar.
 */
const ImageButtonComponent = ({insertImages}) =>
    <div data-flow={'down'} data-sd-tooltip="Image" className="Editor3-styleButton">
        <span onClick={insertImages}><i className="icon-picture" /></span>
    </div>;

ImageButtonComponent.propTypes = {
    insertImages: PropTypes.func.isRequired
};

const mapDispatchToProps = (dispatch) => ({
    insertImages: () => dispatch(actions.insertImages())
});

export const ImageButton = connect(null, mapDispatchToProps)(ImageButtonComponent);
