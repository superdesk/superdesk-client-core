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
        // tslint:disable-next-line:max-line-length
        `<div style="display: flex; position: relative; line-height: initial;"><button data-test-id="toggle-button">Toggle Button</button><div tabindex="0" style="position: absolute; top: 100%; right: 0px;"><div style="background: rgb(248, 248, 248); max-height: 400px; overflow: auto; box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 10px, rgba(0, 0, 0, 0.1) 0px 3px 1px -2px;"><div><div style="padding-left: 0px;"><div style="padding-left: 0px;"><div>item 1-1</div><div style="padding-left: 20px;"><div>subgroup 1</div><div style="padding-left: 20px;"><div>subgroup item 1</div><div>subgroup item 2</div><div style="padding-left: 40px;"><div>subgroup 2</div><div style="padding-left: 40px;"><div>subgroup item 2.1</div><div>subgroup item 2.2</div><div>subgroup item 2.3</div></div></div><div>subgroup item 3</div></div></div><div>item 1-2</div><div>item 1-3</div><div>item 1-4</div></div></div></div><div><div style="padding-left: 0px;"><div>group 2</div><div style="padding-left: 0px;"><div>item 2-1</div><div>item 2-2</div><div>item 2-3</div></div></div></div><div><div style="padding-left: 0px;"><div>group 3</div><div style="padding-left: 0px;"><div>item 3-1</div><div>item 3-2</div><div>item 3-3</div></div></div></div></div></div></div>`,
    );
});
