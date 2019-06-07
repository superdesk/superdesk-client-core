
import React from 'react';
import classNames from 'classnames';

interface IProps<T> {
    getToggleElement(onClick: () => void): JSX.Element;
    items: Array<T>;
    renderItem(item: T): JSX.Element;
    onSelect(item: T): void;
}

interface IState {
    open: boolean;
}

export class DropdownButton<T> extends React.PureComponent<IProps<T>, IState> {
    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            open: false,
        };
    }
    render() {
        const {items, renderItem, onSelect, getToggleElement} = this.props;

        const onClick = () => this.setState({open: !this.state.open});

        return (
            <div className={classNames('dropdown dropdown--align-right', {open: this.state.open})}>
                {getToggleElement(onClick)}
                <ul className="dropdown__menu dropdown__menu--scrollable">
                    {
                        items.map(
                            (item, i) => (
                                <li key={i}>
                                    <button
                                        style={{display: 'block'}}
                                        onClick={() => {
                                            this.setState({open: false});
                                            onSelect(item);
                                        }}
                                    >
                                        {renderItem(item)}
                                    </button>
                                </li>
                            ),
                        )
                    }
                </ul>
            </div>
        );
    }
}
