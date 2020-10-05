
import React from 'react';
import {IDropdownTreeGroup, IPropsDropdownTree} from 'superdesk-api';

interface IState {
    open: boolean;
}

function isGroup<T>(x: T | IDropdownTreeGroup<T>): x is IDropdownTreeGroup<T> {
    return typeof x['items'] !== 'undefined';
}

export class DropdownTree<T> extends React.PureComponent<IPropsDropdownTree<T>, IState> {
    dropdownNode: HTMLDivElement;

    constructor(props: IPropsDropdownTree<T>) {
        super(props);

        this.state = {
            open: false,
        };

        this.renderGroupRecursive = this.renderGroupRecursive.bind(this);
        this.closeDropdown = this.closeDropdown.bind(this);
    }
    private closeDropdown() {
        this.setState({open: false});
    }
    private renderGroupRecursive(item: T | IDropdownTreeGroup<T>, level: number, key: number) {
        const {renderItem} = this.props;

        if (isGroup(item)) {
            return (
                <div style={{paddingLeft: (20 * level + 'px')}}>
                    {typeof item.render === 'function' ? item.render() : null}
                    <div style={{paddingLeft: (20 * level + 'px')}}>
                        {
                            item.items.map((_item, i) => (
                                this.renderGroupRecursive(_item, level + 1, i)
                            ))
                        }
                    </div>
                </div>
            );
        } else {
            return renderItem(key.toString(), item, this.closeDropdown);
        }
    }
    render() {
        const {groups, getToggleElement, inline} = this.props;
        const onClick = () => this.setState({open: !this.state.open});

        return (
            <div
                style={inline ?
                    {display: 'inline-flex', lineHeight: 'initial', verticalAlign: 'bottom'} :
                    {display: 'flex', position: 'relative', lineHeight: 'initial'}
                }
                data-test-id={this.props['data-test-id']}
            >
                {getToggleElement(this.state.open, onClick)}
                {
                    this.state.open ? (
                        <div
                            ref={(node) => {
                                if (node != null) {
                                    node.focus();
                                }

                                this.dropdownNode = node;
                            }}
                            tabIndex={0}
                            onBlur={(event) => {
                                // don't close the dropdown on blur
                                // if focus went to toggle element or an element inside the dropdown
                                if (
                                    this.dropdownNode.contains(
                                        event.relatedTarget as Element,
                                    ) === false
                                    && this.dropdownNode.previousElementSibling.isSameNode(
                                        event.relatedTarget as Element,
                                    ) === false
                                ) {
                                    this.closeDropdown();
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                            }}
                        >
                            <div
                                style={{
                                    background: '#F8F8F8',
                                    maxHeight: 400,
                                    overflow: 'auto',
                                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4), 0 3px 1px -2px rgba(0, 0, 0, 0.1)',
                                    ...(this.props.wrapperStyles || {}),
                                }}
                            >
                                {
                                    groups.map((group, i) => (
                                        <div key={i}>{this.renderGroupRecursive(group, 0, 0)}</div>
                                    ))
                                }
                            </div>
                        </div>
                    ) : null
                }
            </div>
        );
    }
}
