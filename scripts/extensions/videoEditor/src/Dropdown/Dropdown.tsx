import * as React from 'react';
import VideoEditorContext from '../VideoEditorContext';

interface IProps {
    label: React.ReactElement<any>;
    items: Array<{label: string, value: number}>;
    onSelect: (item: number) => void;
    isButton?: boolean;
    className?: string;
    disabled?: boolean; // force close dropdown
}
interface IState {
    open: boolean;
    selectedItem: string | number | null;
}

export class Dropdown extends React.Component<IProps, IState> {
    static contextType = VideoEditorContext;
    constructor(props: IProps) {
        super(props);
        this.state = {
            open: false,
            selectedItem: null,
        };
    }

    componentDidUpdate(prevProps: IProps) {
        if (this.props.disabled !== prevProps.disabled) {
            this.handleDisable();
        }
    }

    handleDisable = () => {
        if (this.props.disabled === true) {
            this.setState({
                open: false,
                selectedItem: null,
            });
        }
    }

    handleToggle = () => {
        // use for custom action when item is already selected
        // e.g. toggle crop mode
        if (!this.state.open && this.state.selectedItem && this.props.isButton) {
            this.props.onSelect(0);
            this.setState({selectedItem: null});
            return;
        }
        this.setState({
            open: !this.state.open,
        });
    }

    handleSelect = (value: number) => {
        this.setState({open: false, selectedItem: value});
        this.props.onSelect(value);
    }

    render() {
        const {gettext} = this.context.superdesk.localization;

        return (
            <div className={`dropdown ${this.state.open ? 'open' : ''} ${this.props.className || ''}`}>
                {React.cloneElement(this.props.label as React.ReactElement<any>, {
                    onClick: this.handleToggle,
                    selectedItem: this.state.selectedItem,
                })}
                <ul className="dropdown__menu">
                    {this.props.items.map((item) => (
                        <li key={item.value} onClick={() => this.handleSelect(item.value)}>
                            <button>{gettext(item.label)}</button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
}
