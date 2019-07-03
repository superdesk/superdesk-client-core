
import React from 'react';
import classNames from 'classnames';

interface IGroup<T> {
    render(): JSX.Element;
    items: Array<T | IGroup<T>>;
}

interface IProps<T> {
    groups: Array<IGroup<T>>;
    getToggleElement(onClick: () => void): JSX.Element;
    getItemLabel(item: T): string;
    renderItem(item: T): JSX.Element;
    onSelect(item: T): void;
}

interface IState {
    open: boolean;
}

function isGroup<T>(x: T | IGroup<T>): x is IGroup<T> {
    return typeof x['items'] !== 'undefined';
}

export class DropdownTree<T> extends React.PureComponent<IProps<T>, IState> {
    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            open: false,
        };

        this.renderGroupRecursive = this.renderGroupRecursive.bind(this);
    }
    private renderGroupRecursive(item: T | IGroup<T>, level: number) {
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

        return (
            <div
                className={classNames('dropdown dropdown--align-right', {open: this.state.open})}
                style={{lineHeight: 'initial'}}
            >
                {getToggleElement(onClick)}
                <div className="dropdown__menu dropdown__menu--scrollable">
                    {
                        groups.map((group, i) => <div key={i}>{this.renderGroupRecursive(group, 0)}</div>)
                    }
                </div>
            </div>
        );
    }
}
