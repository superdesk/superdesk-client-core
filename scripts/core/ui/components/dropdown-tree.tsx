
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
    }
    private renderGroupRecursive(item: T | IDropdownTreeGroup<T>, level: number) {
        const {renderItem, onSelect, getItemLabel} = this.props;

        if (isGroup(item)) {
            return (
                <div style={{paddingLeft: (20 * level + 'px')}}>
                    {typeof item.render === 'function' ? item.render() : null}
                    {
                        item.items.map((_item, i) => (
                            <div key={i} style={{paddingLeft: (20 * level + 'px')}}>
                                {this.renderGroupRecursive(_item, level + 1)}
                            </div>
                        ))
                    }
                </div>
            );
        } else {
            return (
                <div>
                    <button
                        style={{display: 'block', width: '100%', padding: 0, textAlign: 'left'}}
                        onClick={() => {
                            this.setState({open: false});
                            onSelect(item);
                        }}
                        data-test-id={getItemLabel(item)}
                    >
                        {renderItem(item)}
                    </button>
                </div>
            );
        }
    }
    render() {
        const {groups, getToggleElement} = this.props;

        const onClick = () => this.setState({open: !this.state.open});

        const Wrapper = this.props.wrapper || defaultWrapper;

        return (
            <div
                className={classNames('dropdown dropdown--align-right', {open: this.state.open})}
                style={{display: 'flex', lineHeight: 'initial'}}
            >
                {getToggleElement(onClick)}
                <div className="dropdown__menu dropdown__menu--scrollable">
                    <Wrapper>
                        {
                            groups.map((group, i) => <div key={i}>{this.renderGroupRecursive(group, 0)}</div>)
                        }
                    </Wrapper>
                </div>
            </div>
        );
    }
}
