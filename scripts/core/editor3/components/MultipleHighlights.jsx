// IMPORTANT NOTE: this component is agnostic about how highlights are persisted.
// Do not add persistence related code in this file.

import React from 'react';
import PropTypes from 'prop-types';
import * as Highlights from '../helpers/highlights';

export class MultipleHighlights extends React.Component {
    addHighlight(highlightType, highlightData) {
        const editorState = Highlights.addHighlight(this.props.editorState, highlightType, highlightData);

        this.props.onHighlightChange(editorState);
        return editorState;
    }

    removeHighlight(styleName) {
        const editorState = Highlights.removeHighlight(this.props.editorState, styleName);

        this.props.onHighlightChange(editorState);
        return editorState;
    }

    updateHighlightData(styleName, nextData) {
        const editorState = Highlights.updateHighlightData(this.props.editorState, styleName, nextData);

        this.props.onHighlightChange(editorState);
        return editorState;
    }

    canAddtHighlight(highlightType) {
        return Highlights.canAddtHighlight(this.props.editorState, highlightType);
    }

    getHighlightData(styleName) {
        return Highlights.getHighlightData(this.props.editorState, styleName);
    }

    getHighlightsCount(highlightType) {
        return Highlights.getHighlightsCount(this.props.editorState, highlightType);
    }

    render() {
        const {children, editorState} = this.props;
        const propsExcludingOwn = Object.keys(this.props)
            .filter((key) => (key !== 'onHighlightChange' && key !== 'children'))
            .reduce((obj, key) => {
                obj[key] = this.props[key];
                return obj;
            }, {});

        var childrenWithProps = React.Children.map(
            children, (child) =>
                React.cloneElement(child, {
                    ...propsExcludingOwn,
                    highlightsManager: {
                        styleMap: Highlights.getHighlightsStyleMap(editorState),
                        addHighlight: this.addHighlight.bind(this),
                        removeHighlight: this.removeHighlight.bind(this),
                        getHighlightData: this.getHighlightData.bind(this),
                        updateHighlightData: this.updateHighlightData.bind(this),
                        canAddHighlight: this.canAddtHighlight.bind(this),
                        styleNameBelongsToHighlight: Highlights.styleNameBelongsToHighlight,
                        getHighlightTypeFromStyleName: Highlights.getHighlightTypeFromStyleName,
                        getHighlightsCount: this.getHighlightsCount.bind(this),
                        hadHighlightsChanged: Highlights.hadHighlightsChanged,
                        availableHighlights: Highlights.availableHighlights
                    }
                })
        );

        return <div>{childrenWithProps}</div>;
    }
}

MultipleHighlights.propTypes = {
    editorState: PropTypes.object.isRequired,
    onHighlightChange: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
};