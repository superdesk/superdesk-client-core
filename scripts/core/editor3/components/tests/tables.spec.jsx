import React from 'react';
import {ContentState} from 'draft-js';
import {shallow, mount} from 'enzyme';
import {tableBlockAndContent} from './utils';
import {TableCell} from '../tables';
import {TableBlockComponent as TableBlock} from '../tables/TableBlock';
import {TableButtonComponent as TableButton} from '../tables/TableButton';

describe('editor3.component.table-button', () => {
    it('should call action when clicked', () => {
        const action = jasmine.createSpy();
        const wrapper = mount(<TableButton addTable={action} />);

        wrapper.find('span').simulate('click');

        expect(action).toHaveBeenCalled();
    });
});

describe('editor3.component.table-block', () => {
    function getBlockData(block, contentState) {
        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);
        const {data} = entity.getData();

        return data;
    }

    it('should render 2 rows and 6 cells', () => {
        const {block, contentState} = tableBlockAndContent();
        const wrapper = shallow(
            <TableBlock
                contentState={contentState}
                block={block}
                setReadOnly={() => { /* no-op */ }}
                editorState={{}}
                parentOnChange={() => { /* no-op */ }}
                parentReadOnly={false} />
        );

        expect(wrapper.find('tr').length).toEqual(2);
        expect(wrapper.find('TableCell').length).toEqual(6);
    });

    it('should render table controls when parent is readOnly', () => {
        const {block, contentState} = tableBlockAndContent();
        const wrapper = shallow(
            <TableBlock
                contentState={contentState}
                block={block}
                setReadOnly={() => { /* no-op */ }}
                editorState={{}}
                parentOnChange={() => { /* no-op */ }}
                parentReadOnly={true} />
        );

        expect(wrapper.find('.table-block__controls').length).toEqual(1);
    });

    it('should not render table controls when parent is not readOnly', () => {
        const {block, contentState} = tableBlockAndContent();
        const wrapper = shallow(
            <TableBlock
                contentState={contentState}
                block={block}
                setReadOnly={() => { /* no-op */ }}
                editorState={{}}
                parentOnChange={() => { /* no-op */ }}
                parentReadOnly={false} />
        );

        expect(wrapper.find('.table-block__controls').length).toEqual(0);
    });

    it('should add a row when clicking the add row button', () => {
        const {block, contentState} = tableBlockAndContent();
        const wrapper = mount(
            <TableBlock
                contentState={contentState}
                block={block}
                setReadOnly={() => { /* no-op */ }}
                editorState={{}}
                parentOnChange={() => { /* no-op */ }}
                parentReadOnly={true} />
        );

        expect(getBlockData(block, contentState).numRows).toBe(2);
        wrapper.find('.add-row').simulate('click');
        expect(getBlockData(block, contentState).numRows).toBe(3);
    });

    it('should add a column when clicking the add column button', () => {
        const {block, contentState} = tableBlockAndContent();
        const wrapper = mount(
            <TableBlock
                contentState={contentState}
                block={block}
                setReadOnly={() => { /* no-op */ }}
                editorState={{}}
                parentOnChange={() => { /* no-op */ }}
                parentReadOnly={true} />
        );

        expect(getBlockData(block, contentState).numCols).toBe(3);
        wrapper.find('.add-col').simulate('click');
        expect(getBlockData(block, contentState).numCols).toBe(4);
    });

    it('should render correct text in each cell', () => {
        const {block, contentState} = tableBlockAndContent();
        const wrapper = mount(
            <TableBlock
                contentState={contentState}
                block={block}
                setReadOnly={() => { /* no-op */ }}
                editorState={{}}
                parentOnChange={() => { /* no-op */ }}
                parentReadOnly={true} />
        );

        ['a', 'b', 'c', 'd', 'e', 'f'].forEach((letter, i) => {
            const cellContentState = wrapper.find('TableCell').at(i)
                .prop('contentState');
            const cellText = cellContentState.getPlainText('');

            expect(cellText).toBe(letter);
        });
    });
});

describe('editor3.component.table-cell', () => {
    it('should render', () => {
        const wrapper = shallow(
            <TableCell
                contentState={ContentState.createFromText('abc')}
                onChange={() => { /* no-op */ }}
                onFocus={() => { /* no-op */ }} />
        );

        expect(wrapper.find('DraftEditor').length).toBe(1);
    });
});
