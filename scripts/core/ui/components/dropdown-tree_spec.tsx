import React from 'react';
import {mount} from 'enzyme';
import {noop} from 'lodash';
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
    expect(
        mount(
            <DropdownTree
                getToggleElement={(onClick) => (<button onClick={onClick}>Toggle Button</button>)}
                groups={groups}
                renderItem={(item) => (<div>{item.text}</div>)}
                getItemLabel={(item) => item.text}
                onSelect={noop}
            />,
        ).html(),
    ).toBe(
        // tslint:disable-next-line:max-line-length
        `<div class="dropdown dropdown--align-right" style="line-height: initial;"><button>Toggle Button</button><div class="dropdown__menu dropdown__menu--scrollable"><div><div style="padding-left: 0px;"><div style="padding-left: 0px;"><div><button data-test-id="item 1-1" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>item 1-1</div></button></div></div><div style="padding-left: 0px;"><div style="padding-left: 20px;"><div>subgroup 1</div><div style="padding-left: 20px;"><div><button data-test-id="subgroup item 1" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>subgroup item 1</div></button></div></div><div style="padding-left: 20px;"><div><button data-test-id="subgroup item 2" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>subgroup item 2</div></button></div></div><div style="padding-left: 20px;"><div style="padding-left: 40px;"><div>subgroup 2</div><div style="padding-left: 40px;"><div><button data-test-id="subgroup item 2.1" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>subgroup item 2.1</div></button></div></div><div style="padding-left: 40px;"><div><button data-test-id="subgroup item 2.2" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>subgroup item 2.2</div></button></div></div><div style="padding-left: 40px;"><div><button data-test-id="subgroup item 2.3" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>subgroup item 2.3</div></button></div></div></div></div><div style="padding-left: 20px;"><div><button data-test-id="subgroup item 3" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>subgroup item 3</div></button></div></div></div></div><div style="padding-left: 0px;"><div><button data-test-id="item 1-2" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>item 1-2</div></button></div></div><div style="padding-left: 0px;"><div><button data-test-id="item 1-3" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>item 1-3</div></button></div></div><div style="padding-left: 0px;"><div><button data-test-id="item 1-4" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>item 1-4</div></button></div></div></div></div><div><div style="padding-left: 0px;"><div>group 2</div><div style="padding-left: 0px;"><div><button data-test-id="item 2-1" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>item 2-1</div></button></div></div><div style="padding-left: 0px;"><div><button data-test-id="item 2-2" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>item 2-2</div></button></div></div><div style="padding-left: 0px;"><div><button data-test-id="item 2-3" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>item 2-3</div></button></div></div></div></div><div><div style="padding-left: 0px;"><div>group 3</div><div style="padding-left: 0px;"><div><button data-test-id="item 3-1" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>item 3-1</div></button></div></div><div style="padding-left: 0px;"><div><button data-test-id="item 3-2" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>item 3-2</div></button></div></div><div style="padding-left: 0px;"><div><button data-test-id="item 3-3" style="display: block; width: 100%; padding: 0px; text-align: left;"><div>item 3-3</div></button></div></div></div></div></div></div>`,
    );
});
