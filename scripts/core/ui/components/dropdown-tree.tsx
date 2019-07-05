
import React from 'react';
import classNames from 'classnames';
import {IDropdownTreeGroup, IPropsDropdownTree} from 'superdesk-api';

interface IState {
    open: boolean;
}

function isGroup<T>(x: T | IDropdownTreeGroup<T>): x is IDropdownTreeGroup<T> {
    return typeof x['items'] !== 'undefined';
}

const defaultWrapper: React.StatelessComponent = (props) => <div>{props.children}</div>;

export class DropdownTree<T> extends React.PureComponent<IPropsDropdownTree<T>, IState> {
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
        const {groups, getToggleElement, maxWidth} = this.props;
        const onClick = () => this.setState({open: !this.state.open});
        const Wrapper = this.props.wrapper || defaultWrapper;

        return (
            <div
                style={{display: 'flex', position: 'relative', lineHeight: 'initial'}}
            >
                {getToggleElement(this.state.open, onClick)}
                <div style={{
                    display: this.state.open ? 'block' : 'none',
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4), 0 3px 1px -2px rgba(0, 0, 0, 0.1)',
                    maxWidth: maxWidth == null ? undefined : maxWidth,
                }}>
                    <Wrapper>
                        {
                            groups.map((group, i) => <div key={i}>{this.renderGroupRecursive(group, 0, 0)}</div>)
                        }
                    </Wrapper>
                </div>
            </div>
        );
    }
}
