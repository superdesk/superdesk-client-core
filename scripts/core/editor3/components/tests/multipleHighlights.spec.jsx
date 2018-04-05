/* eslint-disable react/no-multi-comp */

import React from 'react';
import {mount} from 'enzyme';
import PropTypes from 'prop-types';
import {EditorState, ContentState, SelectionState} from 'draft-js';
import {MultipleHighlights} from '../MultipleHighlights';

const contentState = ContentState.createFromText(
// eslint-disable-next-line indent
`Not enjoyment, and not sorrow,
Is our destined end or way;
But to act, that each tomorrow
Find us farther than today.`
);

const editorState = EditorState.createWithContent(contentState);

const blockKeys = editorState
    .getCurrentContent()
    .getBlocksAsArray()
    .map((block) => block.getKey());

const getKeyForNthBlock = (n) => blockKeys[n - 1];

const highlightData = {author: 'Henry Wadsworth Longfellow'};
const highlightDataExpectedResponse = {author: 'Henry Wadsworth Longfellow', type: 'COMMENT'};
const highlightDataUpdate = {publishedIn: 1838};

class ChildComponent extends React.Component {
    render() {
        return <div />;
    }
}

class MultipleHighlightsTester extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editorState: props.editorState

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
    var highlightsManager = null;
    var getEditorState = null;

    beforeEach(() => {
        const selection = new SelectionState({
            anchorKey: getKeyForNthBlock(1),
            anchorOffset: 2,
            focusKey: getKeyForNthBlock(1),
            focusOffset: 13,
            isBackward: false
        });

        const editorStateWithSelection = EditorState.acceptSelection(editorState, selection);
        const wrapper = mount(<MultipleHighlightsTester editorState={editorStateWithSelection} />);
        const child = wrapper.instance().childRef;

        getEditorState = () => child.props.editorState;
        highlightsManager = child.props.highlightsManager;
    });

    it('should add, remove, and update highlights', () => {
        highlightsManager.addHighlight('COMMENT', highlightData);

        const styleName = getEditorState()
            .getCurrentContent()
            .getFirstBlock()
            .getInlineStyleAt(2)
            .first();

        expect(
            JSON.stringify(highlightsManager.getHighlightData(styleName))
        ).toBe(JSON.stringify(highlightDataExpectedResponse));

        highlightsManager.updateHighlightData(styleName, highlightDataUpdate);
        expect(
            JSON.stringify(highlightsManager.getHighlightData(styleName))
        ).toBe(JSON.stringify(highlightDataUpdate));

        highlightsManager.removeHighlight(styleName);

        const styleNameAfterRemoval = getEditorState()
            .getCurrentContent()
            .getFirstBlock()
            .getInlineStyleAt(2)
            .first();

        expect(styleNameAfterRemoval).toBe(undefined);
        expect(() => {
            highlightsManager.getHighlightData(styleName);
        }).toThrow();
    });

    it('should keep track of highlights count', () => {
        expect(highlightsManager.getHighlightsCount()).toBe(0);
        highlightsManager.addHighlight('COMMENT', {});

        expect(highlightsManager.getHighlightsCount()).toBe(1);
        highlightsManager.addHighlight('COMMENT', {});

        expect(highlightsManager.getHighlightsCount()).toBe(2);
        expect(highlightsManager.getHighlightsCount('ANNOTATION')).toBe(0);

        highlightsManager.addHighlight('ANNOTATION', {});
        expect(highlightsManager.getHighlightsCount()).toBe(3);
        expect(highlightsManager.getHighlightsCount('ANNOTATION')).toBe(1);
        expect(highlightsManager.getHighlightsCount('COMMENT')).toBe(2);

        highlightsManager.addHighlight('ANNOTATION', {});
        expect(highlightsManager.getHighlightsCount()).toBe(4);
        expect(highlightsManager.getHighlightsCount('ANNOTATION')).toBe(2);
        expect(highlightsManager.getHighlightsCount('COMMENT')).toBe(2);
    });

    it('should throw an error when invalid actions are attempted', () => {
        expect(() => {
            highlightsManager.addHighlight('invalid-highlight-type', {});
        }).toThrow();

        expect(() => {
            highlightsManager.getHighlightTypeFromStyleName('invalid-highlight-type', {});
        }).toThrow();

        expect(() => {
            highlightsManager.getHighlightTypeFromStyleName({'not-even-a-string': true}, {});
        }).toThrow();

        expect(() => {
            highlightsManager.getHighlightsCount('invalid-highlight-type', {});
        }).toThrow();

        expect(() => {
            highlightsManager.getHighlightData('non-existent-highlight-id', {});
        }).toThrow();

        expect(() => {
            highlightsManager.updateHighlightData('non-existent-highlight-id', {});
        }).toThrow();
    });

    it('should only expand', () => {
        expect(highlightsManager.getHighlightsCount()).toBe(0);
        highlightsManager.addHighlight('COMMENT', {});

        expect(highlightsManager.getHighlightsCount()).toBe(1);
        highlightsManager.addHighlight('COMMENT', {});

        expect(highlightsManager.getHighlightsCount()).toBe(2);
        expect(highlightsManager.getHighlightsCount('ANNOTATION')).toBe(0);

        highlightsManager.addHighlight('ANNOTATION', {});
        expect(highlightsManager.getHighlightsCount()).toBe(3);
        expect(highlightsManager.getHighlightsCount('ANNOTATION')).toBe(1);
        expect(highlightsManager.getHighlightsCount('COMMENT')).toBe(2);

        highlightsManager.addHighlight('ANNOTATION', {});
        expect(highlightsManager.getHighlightsCount()).toBe(4);
        expect(highlightsManager.getHighlightsCount('ANNOTATION')).toBe(2);
        expect(highlightsManager.getHighlightsCount('COMMENT')).toBe(2);
    });
});