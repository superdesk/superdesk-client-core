/* eslint-disable react/no-multi-comp */

import React from 'react';
import {mount} from 'enzyme';
import PropTypes from 'prop-types';
import {EditorState, ContentState, SelectionState} from 'draft-js';
import {MultipleHighlights} from '../MultipleHighlights';

const editorState = EditorState.createWithContent(
    ContentState.createFromText('Don\'t cry because it\'s over, smile because it happened.')
);
const firstBlockKey = editorState
    .getCurrentContent()
    .getFirstBlock()
    .getKey();

const selection = new SelectionState({
    anchorKey: firstBlockKey,
    anchorOffset: 29,
    focusKey: firstBlockKey,
    focusOffset: 34,
    isBackward: false
});

const editorStateWithSelection = EditorState.acceptSelection(editorState, selection);
const highlightData = {author: 'Dr. Seuss'};
const highlightDataExpectedResponse = {author: 'Dr. Seuss', type: 'COMMENT'};
const highlightDataUpdate = {firstMention: 1899};

class ChildComponent extends React.Component {
    render() {
        return <div />;
    }
}

class MultipleHighlightsTester extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editorState: props.editorState !== undefined ? props.editorState : editorStateWithSelection

        };
        this.childRef = null;
    }
    render() {
        return (
            <MultipleHighlights
                availableHighlights={availableHighlights}
                editorState={this.state.editorState}
                onChange={(editorState) => this.setState({editorState})}
                initialState={this.props.initialHighlightsState}
            >
                <ChildComponent ref={(r) => this.childRef = r} />
            </MultipleHighlights>
        );
    }
}

MultipleHighlightsTester.propTypes = {
    editorState: PropTypes.object,
    initialHighlightsState: PropTypes.object,
};

const availableHighlights = {
    COMMENT: {
        backgroundColor: 'red'
    },
    ANNOTATION: {
        backgroundColor: 'blue'
    },
};

describe('multipleHighlights.component', () => {
    it('should add, remove, and update highlights', () => {
        const wrapper = mount(<MultipleHighlightsTester />);
        const child = wrapper.instance().childRef;

        child.props.highlightsManager.addHighlight('COMMENT', highlightData);

        const styleName = child.props.editorState
            .getCurrentContent()
            .getFirstBlock()
            .getInlineStyleAt(29)
            .first();

        expect(
            JSON.stringify(child.props.highlightsManager.getHighlightData(styleName))
        ).toBe(JSON.stringify(highlightDataExpectedResponse));

        child.props.highlightsManager.updateHighlightData(styleName, highlightDataUpdate);
        expect(
            JSON.stringify(child.props.highlightsManager.getHighlightData(styleName))
        ).toBe(JSON.stringify(highlightDataUpdate));

        child.props.highlightsManager.removeHighlight(styleName);

        const styleNameAfterRemoval = child.props.editorState
            .getCurrentContent()
            .getFirstBlock()
            .getInlineStyleAt(29)
            .first();

        expect(styleNameAfterRemoval).toBe(undefined);
        expect(() => {
            child.props.highlightsManager.getHighlightData(styleName);
        }).toThrow();
    });

    it('should keep track of highlights count', () => {
        const wrapper = mount(<MultipleHighlightsTester />);
        const child = wrapper.instance().childRef;

        expect(child.props.highlightsManager.getHighlightsCount()).toBe(0);
        child.props.highlightsManager.addHighlight('COMMENT', {});

        expect(child.props.highlightsManager.getHighlightsCount()).toBe(1);
        child.props.highlightsManager.addHighlight('COMMENT', {});

        expect(child.props.highlightsManager.getHighlightsCount()).toBe(2);
        expect(child.props.highlightsManager.getHighlightsCount('ANNOTATION')).toBe(0);

        child.props.highlightsManager.addHighlight('ANNOTATION', {});
        expect(child.props.highlightsManager.getHighlightsCount()).toBe(3);
        expect(child.props.highlightsManager.getHighlightsCount('ANNOTATION')).toBe(1);
        expect(child.props.highlightsManager.getHighlightsCount('COMMENT')).toBe(2);

        child.props.highlightsManager.addHighlight('ANNOTATION', {});
        expect(child.props.highlightsManager.getHighlightsCount()).toBe(4);
        expect(child.props.highlightsManager.getHighlightsCount('ANNOTATION')).toBe(2);
        expect(child.props.highlightsManager.getHighlightsCount('COMMENT')).toBe(2);
    });

    it('should throw an error when invalid actions are attempted', () => {
        const wrapper = mount(<MultipleHighlightsTester />);
        const child = wrapper.instance().childRef;

        expect(() => {
            child.props.highlightsManager.addHighlight('invalid-highlight-type', {});
        }).toThrow();

        expect(() => {
            child.props.highlightsManager.getHighlightTypeFromStyleName('invalid-highlight-type', {});
        }).toThrow();

        expect(() => {
            child.props.highlightsManager.getHighlightTypeFromStyleName({'not-even-a-string': true}, {});
        }).toThrow();

        expect(() => {
            child.props.highlightsManager.getHighlightsCount('invalid-highlight-type', {});
        }).toThrow();

        expect(() => {
            child.props.highlightsManager.getHighlightData('non-existent-highlight-id', {});
        }).toThrow();

        expect(() => {
            child.props.highlightsManager.updateHighlightData('non-existent-highlight-id', {});
        }).toThrow();
    });
});