import React from 'react';
import {connect} from 'react-redux';
import * as actions from '../../../actions';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name ImageControl
 * @param {Function} insertImages Dispatches the insert images action.
 * @description This component renders the image button on the toolbar.
 */
const ImageControlComponent = ({insertImages}) =>
    <div className="Editor3-styleButton">
        <span onClick={insertImages}>image</span>
    </div>;

ImageControlComponent.propTypes = {
    insertImages: React.PropTypes.func.isRequired
};

const mapDispatchToProps = (dispatch) => ({
    insertImages: () => dispatch(actions.insertImages())
});

const ImageControl = connect(null, mapDispatchToProps)(ImageControlComponent);

export default ImageControl;
