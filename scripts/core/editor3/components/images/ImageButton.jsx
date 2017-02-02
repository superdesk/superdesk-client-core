import React from 'react';
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
    <div className="Editor3-styleButton">
        <span onClick={insertImages}>img</span>
    </div>;

ImageButtonComponent.propTypes = {
    insertImages: React.PropTypes.func.isRequired
};

const mapDispatchToProps = (dispatch) => ({
    insertImages: () => dispatch(actions.insertImages())
});

export const ImageButton = connect(null, mapDispatchToProps)(ImageButtonComponent);
