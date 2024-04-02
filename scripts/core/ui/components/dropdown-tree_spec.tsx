/* eslint-disable react/display-name, react/no-multi-comp */

import React from 'react';
import {mount} from 'enzyme';
import {DropdownTree} from './dropdown-tree';

const groups = [
    {
        render: () => null,
        items: [
            {text: 'item 1-1'},
            {
                render: () => <div>subgroup 1</div>,
                items: [
                    {text: 'subgroup item 1'},
                    {text: 'subgroup item 2'},
                    {
                        render: () => <div>subgroup 2</div>,
                        items: [
                            {text: 'subgroup item 2.1'},
                            {text: 'subgroup item 2.2'},
                            {text: 'subgroup item 2.3'},
                        ],
                    },
                    {text: 'subgroup item 3'},
                ],
            },
            {text: 'item 1-2'},
            {text: 'item 1-3'},
            {text: 'item 1-4'},
        ],
    },
    {
        render: () => <div>group 2</div>,
        items: [
            {text: 'item 2-1'},
            {text: 'item 2-2'},
            {text: 'item 2-3'},
        ],
    },
    {
        render: () => <div>group 3</div>,
        items: [
            {text: 'item 3-1'},
            {text: 'item 3-2'},
            {text: 'item 3-3'},
        ],
    },
];

it('renders correctly', () => {
    const wrapper = mount(
        <DropdownTree
            getToggleElement={
                (isOpen, onClick) => (<button onClick={onClick} data-test-id="toggle-button">Toggle Button</button>)
            }
            groups={groups}
            renderItem={(key, item, closeDropdown) => (<div key={key}>{item.text}</div>)}
        />,
    );

    wrapper.find('[data-test-id="toggle-button"]').simulate('click');

    expect(
        wrapper.html(),
    ).toBe(
        // eslint-disable-next-line max-len
        '<div style="display: flex; position: relative; line-height: initial;"><button data-test-id="toggle-button">Toggle Button</button><div tabindex="0" style="position: absolute; z-index: 1; inset-block-start: 100%; inset-inline-end: 0px;"><div class="custom-dropdown__menu"><div><div style="padding-inline-start: 0px;"><div style="padding-inline-start: 0px;"><div>item 1-1</div><div style="padding-inline-start: 20px;"><div>subgroup 1</div><div style="padding-inline-start: 20px;"><div>subgroup item 1</div><div>subgroup item 2</div><div style="padding-inline-start: 40px;"><div>subgroup 2</div><div style="padding-inline-start: 40px;"><div>subgroup item 2.1</div><div>subgroup item 2.2</div><div>subgroup item 2.3</div></div></div><div>subgroup item 3</div></div></div><div>item 1-2</div><div>item 1-3</div><div>item 1-4</div></div></div></div><div><div style="padding-inline-start: 0px;"><div>group 2</div><div style="padding-inline-start: 0px;"><div>item 2-1</div><div>item 2-2</div><div>item 2-3</div></div></div></div><div><div style="padding-inline-start: 0px;"><div>group 3</div><div style="padding-inline-start: 0px;"><div>item 3-1</div><div>item 3-2</div><div>item 3-3</div></div></div></div></div></div></div>',
    );
});
