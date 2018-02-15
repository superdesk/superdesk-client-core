import React from 'react';
import PropTypes from 'prop-types';

import {
    RichUtils
} from 'draft-js';

import {getDraftCharacterListForSelection} from '../helpers/getDraftCharacterListForSelection';

function getHighlightType(styleName) {
    var delimiterIndex = styleName.lastIndexOf('-');

    if (delimiterIndex === -1) {
        throw new Error('styleName doesn\'t belong to a highlight');
    }

    return styleName.slice(0, delimiterIndex);
}

export class MultipleHighlights extends React.Component {
    // TODO: implement a configuration option to prevent modifying a highlight

    constructor(props) {
        super(props);

        this.state = {
            highlightsStyleMap: {},
            highlightsData: {},
            lastHighlightIds: Object.keys(props.availableHighlights).reduce((obj, key) => {
                obj[key] = 0;
                return obj;
            }, {})
        };
    }

    loadInitialState(state, callback) {
        this.setState({
            ...state,
            highlightsStyleMap: Object.keys(state.highlightsData).reduce((obj, styleName) => {
                obj[styleName] = this.props.availableHighlights[getHighlightType(styleName)];
                return obj;
            }, {})
        }, callback);
    }

    styleNameBelongsToHighlight(styleName) {
        var delimiterIndex = styleName.lastIndexOf('-');

        if (delimiterIndex === -1) {
            return false;
        }

        return Object.keys(this.props.availableHighlights).includes(styleName.slice(0, delimiterIndex));
    }

    getHighlightData(styleName) {
        return this.state.highlightsData[styleName];
    }

    canAddtHighlight(editorState, highlightType) {
        function characterHasAHighlightOfTheSameType(character) {
            if (
                character.getStyle()
                    .some((styleName) =>
                        this.styleNameBelongsToHighlight(styleName)
                        && getHighlightType(styleName) === highlightType)
            ) {
                return true;
            }

            return false;
        }

        const selection = editorState.getSelection();

        if (selection.isCollapsed()) {
            return false;
        }

        return getDraftCharacterListForSelection(editorState)
            .some(characterHasAHighlightOfTheSameType.bind(this)) === false;
    }

    exportState() {
        let state = {...this.state};

        // in order to support changing highlight styles, styleMap is not exported
        // instead it's constructed from `highlightsData` and `availableHighlights` on `loadInitialState`
        delete state.highlightsStyleMap;
        return state;
    }

    addHighlight(editorState, highlightType, highlightData, callback) {
        // NICE-TO-HAVE: remove associated data when highlights are removed by deleting characters in the editor

        const styleName = highlightType + '-' + this.state.lastHighlightIds[highlightType] + 1;

        this.setState({
            lastHighlightIds: {
                ...this.state.lastHighlightIds,
                [highlightType]: this.state.lastHighlightIds[highlightType] + 1
            },
            highlightsStyleMap: {
                ...this.state.highlightsStyleMap,
                [styleName]: this.props.availableHighlights[highlightType]
            },
            highlightsData: {...this.state.highlightsData, [styleName]: highlightData}
        }, () => {
            callback(
                RichUtils.toggleInlineStyle(
                    editorState,
                    styleName
                )
            );
        });
    }

    removeHighlight(styleName) {
        const highlightType = getHighlightType(styleName);

        var nextHighlightsStyleMap = {...this.state.highlightsStyleMap};

        delete nextHighlightsStyleMap[styleName];

        var nextHighlightsData = {...this.state.highlightsData};

        delete nextHighlightsData[styleName];

        this.setState({
            lastHighlightIds: {
                ...this.state.lastHighlightIds,
                [highlightType]: this.state.lastHighlightIds[highlightType] - 1
            },
            highlightsStyleMap: nextHighlightsStyleMap,
            highlightsData: nextHighlightsData
        });
    }

    updateHighlightData(styleName, nextData) {
        if (this.state.highlightsData[styleName] !== undefined) {
            throw new Error('Can\'t update a Highlight which doesn\'t exist.');
        }

        this.setState({
            highlightsData: {...this.state.highlightsData, [styleName]: nextData}
        });
    }

    render() {
        const {children} = this.props;

        var childrenWithProps = React.Children.map(
            children, (child) =>
                React.cloneElement(child, {
                    highlights: {
                        styleMap: this.state.highlightsStyleMap,
                        add: this.addHighlight.bind(this),
                        remove: this.removeHighlight.bind(this),
                        getHighlightData: this.getHighlightData.bind(this),
                        updateHighlightData: this.updateHighlightData.bind(this),
                        canAddHighlight: this.canAddtHighlight.bind(this),
                        loadInitialState: this.loadInitialState.bind(this),
                        exportState: this.exportState.bind(this),
                        availableHighlights: this.props.availableHighlights
                    }
                })
        );

        return <div>{childrenWithProps}</div>;
    }
}

MultipleHighlights.propTypes = {
    children: PropTypes.node.isRequired,
    availableHighlights: PropTypes.object.isRequired,
};