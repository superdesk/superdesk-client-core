import * as React from 'react';
import {IDropdownLabel} from '../interfaces';

interface IDropdownItem {
    label: string;
    value: number;
}

interface IProps {
    label: React.ReactElement<HTMLButtonElement | HTMLDivElement>;
    items: Array<IDropdownItem>;
    onSelect: (item: number) => void;
    isButton?: boolean;
    className?: string;
    disabled?: boolean; // force close dropdown
    gettext: (text: string) => string;
}
interface IState {
    open: boolean;
    selectedItem: IDropdownItem;
}

export class Dropdown extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            open: false,
            selectedItem: {label: '', value: 0},
        };
        this.handleToggle = this.handleToggle.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
    }

    componentDidUpdate(prevProps: IProps) {
        if (this.props.disabled !== prevProps.disabled) {
            this.handleDisable();
        }
    }

    handleDisable() {
        if (this.props.disabled === true) {
            this.setState({
                open: false,
                selectedItem: {label: '', value: 0},
            });
        }
    }

    handleToggle() {
        // use for custom action when item is already selected
        // e.g. toggle crop mode
        if (!this.state.open && this.state.selectedItem.value && this.props.isButton) {
            this.props.onSelect(0);
            this.setState({selectedItem: {label: '', value: 0}});
            return;
        }
        this.setState({
            open: !this.state.open,
        });
    }

    handleSelect(item: IDropdownItem) {
        this.setState({open: false, selectedItem: item});
        this.props.onSelect(item.value);
    }

    render() {
        const {gettext} = this.props;

        return (
            <div className={`dropdown ${this.state.open ? 'open' : ''} ${this.props.className || ''}`}>
                {React.cloneElement<IDropdownLabel>(this.props.label, {
                    onClick: this.handleToggle,
                    selectedItem: this.state.selectedItem,
                })}
                <ul className="dropdown__menu">
                    {this.props.items.map((item) => (
                        <li key={item.value} onClick={() => this.handleSelect(item)}>
                            <button>{gettext(item.label)}</button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
}
