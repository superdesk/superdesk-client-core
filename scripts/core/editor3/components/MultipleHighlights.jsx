// IMPORTANT NOTE: this component is agnostic about how highlights are persisted.
// Do not add persistence related code in this file.

import React from 'react';
import PropTypes from 'prop-types';

import {
    RichUtils
} from 'draft-js';

import {getDraftCharacterListForSelection} from '../helpers/getDraftCharacterListForSelection';
import {getDraftSelectionForEntireContent} from '../helpers/getDraftSelectionForEntireContent';
import {expandDraftSelection} from '../helpers/expandDraftSelection';
import {clearInlineStyles} from '../helpers/clearInlineStyles';

function getHighlightType(styleName) {
    var delimiterIndex = styleName.lastIndexOf('-');

    if (delimiterIndex === -1) {
        throw new Error('styleName doesn\'t belong to a highlight');
    }

    return styleName.slice(0, delimiterIndex);
}

export class MultipleHighlights extends React.Component {
    highlightTypeValid(highlightType) {
        return Object.keys(this.props.availableHighlights).includes(highlightType);
    }

    styleNameBelongsToHighlight(styleName) {
        var delimiterIndex = styleName.lastIndexOf('-');

        if (delimiterIndex === -1) {
            return false;
        }

        return Object.keys(this.props.availableHighlights).includes(styleName.slice(0, delimiterIndex));
    }

    getHighlightTypeFromStyleName(styleName) {
        var delimiterIndex = styleName.lastIndexOf('-');

        if (delimiterIndex === -1) {
            throw new Error('Style name does not contain a highlight type');
        }

        var highlightType = styleName.slice(0, delimiterIndex);

        if (this.highlightTypeValid(highlightType) === false) {
            throw new Error(`Invalid highlight type '${highlightType}'`);
        }

        return highlightType;
    }

    getHighlightsCount(highlightType, editorState) {
        const {newHighlightsState} = this.initHighlights(editorState);

        if (highlightType !== undefined) {
            if (this.highlightTypeValid(highlightType) === false) {
                throw new Error(`Invalid highlight type '${highlightType}'`);
            }
            return newHighlightsState.lastHighlightIds[highlightType];
        } else {
            // count highlights of all types
            return Object.keys(newHighlightsState.lastHighlightIds)
                .reduce((count, key) => count + newHighlightsState.lastHighlightIds[key], 0);
        }
    }

    getHighlightData(styleName, editorState) {
        const {newHighlightsState} = this.initHighlights(editorState);

        return newHighlightsState.highlightsData[styleName];
    }

    canAddtHighlight(highlightType, editorState) {
        const {newEditorState} = this.initHighlights(editorState);

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

        if (newEditorState.getSelection().isCollapsed()) {
            return false;
        }

        // selection is expanded to include edges
        // so you can't add a highlight right next to another
        const selection = expandDraftSelection(
            newEditorState.getSelection(),
            newEditorState,
            1,
            1,
            true
        );

        return getDraftCharacterListForSelection(newEditorState, selection)
            .some(characterHasAHighlightOfTheSameType.bind(this)) === false;
    }

    saveHighlights({newEditorState: editorState, newHighlightsState}, applyChanges) {
        let newEditorState = this.props.setHighlightsState(editorState, newHighlightsState);

        if (applyChanges) {
            this.props.onHighlightChange(newEditorState, newHighlightsState);
        }

        return newEditorState;
    }

    initHighlights(editorState) {
        const applyChanges = editorState === undefined;
        const newEditorState = editorState || this.props.editorState;
        const newHighlightsState = this.props.getHighlightsState(newEditorState);

        return {newEditorState, newHighlightsState, applyChanges};
    }

    _addHighlight(editorState, highlightsState, highlightType, highlightData) {
        // NICE-TO-HAVE: remove associated data when highlights are removed by deleting characters in the editor
        const styleName = highlightType + '-' + (highlightsState.lastHighlightIds[highlightType] + 1);

        const newHighlightsState = {
            lastHighlightIds: {
                ...highlightsState.lastHighlightIds,
                [highlightType]: highlightsState.lastHighlightIds[highlightType] + 1
            },
            highlightsStyleMap: {
                ...highlightsState.highlightsStyleMap,
                [styleName]: this.props.availableHighlights[highlightType]
            },
            highlightsData: {
                ...highlightsState.highlightsData,
                [styleName]: highlightData
            }
        };

        const newEditorState = RichUtils.toggleInlineStyle(editorState, styleName);

        return {newEditorState, newHighlightsState};
    }


    addHighlight(highlightType, highlightData, editorState) {
        const {newEditorState, newHighlightsState, applyChanges} = this.initHighlights(editorState);

        return this.saveHighlights(
            this._addHighlight(newEditorState, newHighlightsState, highlightType, highlightData),
            applyChanges
        );
    }

    _removeHighlight(editorState, highlightsState, styleName) {
        const highlightType = getHighlightType(styleName);

        let nextHighlightsStyleMap = {...highlightsState.highlightsStyleMap};

        delete nextHighlightsStyleMap[styleName];

        let nextHighlightsData = {...highlightsState.highlightsData};

        delete nextHighlightsData[styleName];

        const newHighlightsState = {
            lastHighlightIds: {
                ...highlightsState.lastHighlightIds,
                [highlightType]: highlightsState.lastHighlightIds[highlightType] - 1
            },
            highlightsStyleMap: nextHighlightsStyleMap,
            highlightsData: nextHighlightsData
        };

        const newEditorState = clearInlineStyles(
            newEditorState,
            getDraftSelectionForEntireContent(editorState),
            [styleName]
        );

        return {newEditorState, newHighlightsState};
    }

    removeHighlight(styleName, editorState) {
        const {newEditorState, newHighlightsState, applyChanges} = this.initHighlights(editorState);

        return this.saveHighlights(
            this._removeHighlight(newEditorState, newHighlightsState, styleName),
            applyChanges
        );
    }

    _updateHighlightData(newEditorState, highlightsState, styleName, nextData) {
        if (highlightsState.highlightsData[styleName] === undefined) {
            throw new Error('Can\'t update a Highlight which doesn\'t exist.');
        }

        const newHighlightsState = {
            ...highlightsState,
            highlightsData: {
                ...highlightsState.highlightsData,
                [styleName]: nextData
            }
        };

        return {newEditorState, newHighlightsState};
    }

    updateHighlightData(styleName, nextData, editorState) {
        const {newEditorState, newHighlightsState, applyChanges} = this.initHighlights(editorState);

        return this.saveHighlights(
            this._updateHighlightData(newEditorState, newHighlightsState, styleName, nextData),
            applyChanges
        );
    }

    render() {
        const propsExcludingOwn = Object.keys(this.props)
            .filter((key) => (
                key !== 'availableHighlights'
                && key !== 'onHighlightChange'
                && key !== 'getHighlightsState'
                && key !== 'setHighlightsState'
                && key !== 'children'
                // editorState must stay
            ))
            .reduce((obj, key) => {
                obj[key] = this.props[key];
                return obj;
            }, {});

        const {children, editorState} = this.props;
        const {newHighlightsState} = this.initHighlights(editorState);

        var childrenWithProps = React.Children.map(
            children, (child) =>
                React.cloneElement(child, {
                    ...propsExcludingOwn,
                    highlightsManager: {
                        styleMap: newHighlightsState.highlightsStyleMap,
                        addHighlight: this.addHighlight.bind(this),
                        removeHighlight: this.removeHighlight.bind(this),
                        getHighlightData: this.getHighlightData.bind(this),
                        updateHighlightData: this.updateHighlightData.bind(this),
                        canAddHighlight: this.canAddtHighlight.bind(this),
                        styleNameBelongsToHighlight: this.styleNameBelongsToHighlight.bind(this),
                        getHighlightTypeFromStyleName: this.getHighlightTypeFromStyleName.bind(this),
                        getHighlightsCount: this.getHighlightsCount.bind(this),
                        availableHighlights: this.props.availableHighlights
                    }
                })
        );

        return <div>{childrenWithProps}</div>;
    }
}

MultipleHighlights.propTypes = {
    editorState: PropTypes.object.isRequired,
    availableHighlights: PropTypes.object.isRequired,
    onHighlightChange: PropTypes.func.isRequired,
    hadHighlightsChanged: PropTypes.func.isRequired,
    getHighlightsState: PropTypes.func.isRequired,
    setHighlightsState: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
};
