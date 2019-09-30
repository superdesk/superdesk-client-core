import * as React from 'react';

interface IProps {
    label: React.ReactElement<any>;
    items: Array<string>;
    onSelect: (item: string) => void;
    isButton?: boolean;
    className?: string;
}
interface IState {
    open: boolean;
    select: string | number | null;
}

export class Dropdown extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            open: false,
            select: null,
        };
    }

    handleToggle = () => {
        // use for custom action when select is not null
        // e.g: toggle crop mode
        if (!this.state.open && this.state.select && this.props.isButton) {
            this.props.onSelect('');
            this.setState({ select: null });
            return;
        }
        this.setState({
            open: !this.state.open,
        });
    };

    handleSelect = (item: string) => {
        this.setState({ open: false, select: item });
        this.props.onSelect(item);
    };

    render() {
        return (
            <div className={`dropdown ${this.state.open ? 'open' : ''} ${this.props.className || ''}`}>
                {React.cloneElement(this.props.label as React.ReactElement<any>, {
                    onClick: this.handleToggle,
                    select: this.state.select,
                })}
                <ul className="dropdown__menu">
                    {this.props.items.map(item => (
                        <li key={item} onClick={() => this.handleSelect(item)}>
                            <a>{item}</a>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
}
