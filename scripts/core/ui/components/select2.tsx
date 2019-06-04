import * as React from "react";
import * as Autocomplete from 'react-autocomplete';
import {noop} from "lodash";

interface IProps<T> {
    items: {[key: string]: T};
    value?: string;
    placeholder?: string;
    renderItem(item: T): JSX.Element;
    getItemLabel(item: T): string;
    getItemValue(item: T): string;
    onSelect(value: string): void;
}

interface IState {
    search: string;
}

const arrowDownStyles = {
    display: 'inline-block',
    marginLeft: 10,
    width: 0,
    height: 0,
    verticalAlign: 'middle',
    borderLeft: '0.4rem solid transparent',
    borderRight: '0.4rem solid transparent',
    borderTop: '0.4rem solid black',
    opacity: 0.3,
};

export class Select2<T> extends React.Component<IProps<T>, IState> {
    state = {search: ''};

    render() {
        const filteredItems = Object.values(this.props.items).filter(
            (item) => this.props.getItemLabel(item).toLocaleLowerCase().includes(this.state.search.toLocaleLowerCase()),
        );

        return (
            <Autocomplete.default
                inputProps={{placeholder: this.props.placeholder}}
                value={this.props.value}
                items={filteredItems}
                wrapperStyle={{}}
                renderInput={(propsAutocomplete: any) => {
                    const selectedItem = this.props.items[this.props.value];

                    if (propsAutocomplete['aria-expanded'] === true) {
                        return (
                            <input
                                {...propsAutocomplete}
                                onChange={(event) => this.setState({search: event.target.value})}
                                value={this.state.search}
                                placeholder={'Search'}
                                autoFocus
                            />
                        );
                    }

                    return (
                        <button
                            {...propsAutocomplete}
                            type="button"
                            className="sd-line-input__select-custom"
                            ref={(element) => {
                                if (element != null) {
                                    // react-autocomplete expects ref to be an input
                                    // but input doesn't support rendering custom children
                                    // so we use a button instead and add a fake method to prevent errors
                                    element['setSelectionRange'] = noop;
                                }

                                const ref: any = propsAutocomplete.ref;

                                ref(element);
                            }}
                            style={{paddingBottom: 6}}
                        >
                            {
                                this.props.value === undefined
                                    ? this.props.placeholder
                                    : this.props.renderItem(selectedItem)
                            }
                            <div style={arrowDownStyles}></div>
                        </button>
                    );
                }}
                getItemValue={this.props.getItemValue}
                onSelect={this.props.onSelect}
                renderItem={(item: T, isHighlighted) => {
                    const commonStyles: React.CSSProperties = {
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '6px 16px',
                        background: 'white',
                    };
                    const style: React.CSSProperties = isHighlighted
                        ? {...commonStyles, background: '#eff7fa'}
                        : commonStyles;

                    return (
                        <button key={this.props.getItemValue(item)} style={style}>
                            {this.props.renderItem(item)}
                        </button>
                    );
                }}
            />
        );
    }
}
