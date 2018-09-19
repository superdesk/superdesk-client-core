// IMPORTANT NOTE: this component is agnostic about how highlights are persisted.
// Do not add persistence related code in this file.

import React from 'react';
import PropTypes from 'prop-types';
import * as Highlights from '../helpers/highlights';

export class MultipleHighlights extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    addHighlight(highlightType, highlightData) {
        const editorState = Highlights.addHighlight(this.props.editorState, highlightType, highlightData);

        this.props.onChange(editorState);
    }

    removeHighlight(styleName) {
        const editorState = Highlights.removeHighlight(this.props.editorState, styleName);

        this.props.onChange(editorState);
    }

    updateHighlightData(styleName, nextData) {
        const editorState = Highlights.updateHighlightData(this.props.editorState, styleName, nextData);

        this.props.onChange(editorState);
    }

    canAddHighlight(highlightType) {
        return Highlights.canAddHighlight(this.props.editorState, highlightType);
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
            .filter((key) => (key !== 'children'))
            .reduce((obj, key) => {
                obj[key] = this.props[key];
                return obj;
            }, {});

        const childrenWithProps = React.Children.map(
            children, (child: any) =>
                React.cloneElement(child, {
                    ...propsExcludingOwn,
                    highlightsManager: {
                        styleMap: Highlights.getHighlightsStyleMap(editorState),
                        addHighlight: this.addHighlight.bind(this),
                        removeHighlight: this.removeHighlight.bind(this),
                        getHighlightData: this.getHighlightData.bind(this),
                        updateHighlightData: this.updateHighlightData.bind(this),
                        canAddHighlight: this.canAddHighlight.bind(this),
                        styleNameBelongsToHighlight: Highlights.styleNameBelongsToHighlight,
                        getHighlightTypeFromStyleName: Highlights.getHighlightTypeFromStyleName,
                        getHighlightsCount: this.getHighlightsCount.bind(this),
                        hadHighlightsChanged: Highlights.hadHighlightsChanged,
                        availableHighlights: Highlights.availableHighlights,
                    },
                }),
        );

        return <div>{childrenWithProps}</div>;
    }
}

MultipleHighlights.propTypes = {
    editorState: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
};
