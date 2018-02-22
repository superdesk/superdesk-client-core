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
    // TODO: implement a configuration option to prevent modifying highlighted text

    constructor(props) {
        super(props);

        this.state = this.props.initialState !== undefined && this.props.initialState !== null
            ? this.getInitialState()
            : {
                highlightsStyleMap: {},
                highlightsData: {},
                lastHighlightIds: Object.keys(props.availableHighlights).reduce((obj, key) => {
                    obj[key] = 0;
                    return obj;
                }, {})
            };
    }

    getInitialState() {
        const {initialState} = this.props;

        return {
            ...initialState,
            highlightsStyleMap: Object.keys(initialState.highlightsData).reduce((obj, styleName) => {
                obj[styleName] = this.props.availableHighlights[getHighlightType(styleName)];
                return obj;
            }, {})
        };
    }

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

    getHighlightsCount(highlightType) {
        if (highlightType !== undefined) {
            if (this.highlightTypeValid(highlightType) === false) {
                throw new Error(`Invalid highlight type '${highlightType}'`);
            }
            return this.state.lastHighlightIds[highlightType];
        } else {
            // count highlights of all types
            return Object.keys(this.state.lastHighlightIds)
                .reduce((count, key) => count + this.state.lastHighlightIds[key], 0);
        }
    }

    getHighlightData(styleName) {
        return this.state.highlightsData[styleName];
    }

    canAddtHighlight(highlightType) {
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

        if (this.props.editorState.getSelection().isCollapsed()) {
            return false;
        }

        // selection is expanded to include edges
        // so you can't add a highlight right next to another
        const selection = expandDraftSelection(
            this.props.editorState.getSelection(),
            this.props.editorState,
            1,
            1,
            true
        );

        return getDraftCharacterListForSelection(this.props.editorState, selection)
            .some(characterHasAHighlightOfTheSameType.bind(this)) === false;
    }

    exportState() {
        let state = {...this.state};

        // in order to support changing highlight styles, styleMap is not exported
        // instead it's constructed from `highlightsData` and `availableHighlights` on `getInitialState`
        delete state.highlightsStyleMap;
        return state;
    }

    addHighlight(highlightType, highlightData) {
        // NICE-TO-HAVE: remove associated data when highlights are removed by deleting characters in the editor

        const styleName = highlightType + '-' + (this.state.lastHighlightIds[highlightType] + 1);

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
            this.props.onHighlightChange(
                RichUtils.toggleInlineStyle(
                    this.props.editorState,
                    styleName
                ),
                this.exportState()
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
        }, () => {
            this.props.onHighlightChange(
                clearInlineStyles(
                    this.props.editorState, getDraftSelectionForEntireContent(this.props.editorState), [styleName]
                ),
                this.exportState()
            );
        });
    }

    updateHighlightData(styleName, nextData) {
        if (this.state.highlightsData[styleName] === undefined) {
            throw new Error('Can\'t update a Highlight which doesn\'t exist.');
        }

        this.setState({
            highlightsData: {...this.state.highlightsData, [styleName]: nextData}
        }, () => {
            this.props.onHighlightChange(this.props.editorState, this.exportState());
        });
    }

    render() {
        const propsExcludingOwn = Object.keys(this.props)
            .filter((key) => (
                key !== 'availableHighlights'
                && key !== 'onHighlightChange'
                && key !== 'initialState'
                && key !== 'children'
                // editorState must stay
            ))
            .reduce((obj, key) => {
                obj[key] = this.props[key];
                return obj;
            }, {});

        const {children} = this.props;

        var childrenWithProps = React.Children.map(
            children, (child) =>
                React.cloneElement(child, {
                    ...propsExcludingOwn,
                    highlightsManager: {
                        styleMap: this.state.highlightsStyleMap,
                        addHighlight: this.addHighlight.bind(this),
                        removeHighlight: this.removeHighlight.bind(this),
                        getHighlightData: this.getHighlightData.bind(this),
                        updateHighlightData: this.updateHighlightData.bind(this),
                        canAddHighlight: this.canAddtHighlight.bind(this),
                        exportState: this.exportState.bind(this),
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
    initialState: PropTypes.object,
    children: PropTypes.node.isRequired,
};
