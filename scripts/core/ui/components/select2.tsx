import * as React from 'react';
import * as Autocomplete from 'react-autocomplete';
import {noop} from 'lodash';

interface IProps<T> {
    items: {[key: string]: T};
    value?: string;
    placeholder?: string;
    disabled?: boolean;
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

// copied from https://github.com/reactjs/react-autocomplete/blob/master/lib/Autocomplete.js#L178
const menuStyleDefault: React.CSSProperties = {
    borderRadius: '3px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '2px 0',
    fontSize: '90%',
    position: 'fixed',
    overflow: 'auto',
    maxHeight: '50%',
};

const menuStyle = {
    ...menuStyleDefault,
    zIndex: 1, // without z-index, items that have opacity set, appear on top of the menu
};

export class Select2<T> extends React.Component<IProps<T>, IState> {
    /**
        There is the following bug in the `react-autocomplete` library:
        If you click an item from the select dropdown, it closes the dropdown without firing a `onSelect` event
        if an internal value `ignoreBlur` is not correct. That value is set onMouseEnter of the dropdown list,
        but if we render a different component or resize existing one *on dropdown open*, the cursor can end up
        **inside** the dropdown menu when it first renders. This means that onMouseEnter never fires, library doesn't
        setup the correct state and clicks on dropdown items don't trigger `onSelect`.
        It's similar to this issue: https://github.com/reactjs/react-autocomplete/issues/254

        To work around this, we use {@link Select2.lastButtonHeight} to ensure that when user clicks the dropdown
        and we want to render the input for filtering, the height of that input will be the same as
        of the button which was rendered there previously. This ensures the mouse pointer won't end up inside the
        dropdown menu on render, onMouseEnter will fire and all will work as expected.
    */
    private lastButtonHeight: number;

    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            search: '',
        };
    }

    render() {
        const filteredItems = Object.values(this.props.items).filter(
            (item) => this.props.getItemLabel(item)
                .toLocaleLowerCase()
                .includes(this.state.search.toLocaleLowerCase()),
        );

        return (
            <Autocomplete.default
                inputProps={{placeholder: this.props.placeholder}}
                value={this.props.value}
                items={filteredItems}
                wrapperStyle={{}}
                menuStyle={menuStyle}
                renderInput={(propsAutocomplete: any) => {
                    const selectedItem = this.props.items[this.props.value];

                    if (propsAutocomplete['aria-expanded'] === true) {
                        return (
                            <input
                                {...propsAutocomplete}
                                onChange={(event) => this.setState({search: event.target.value})}
                                value={this.state.search}
                                style={{height: this.lastButtonHeight + 'px'}}
                                placeholder={'Search'}
                                autoFocus
                            />
                        );
                    }

                    const baseButtonStyle = {paddingBottom: 6};

                    return (
                        <button
                            {...propsAutocomplete}
                            type="button"
                            className="sd-line-input__select-custom"
                            disabled={this.props.disabled}
                            ref={(element) => {
                                if (element != null) {
                                    this.lastButtonHeight = element.offsetHeight;

                                    // react-autocomplete expects ref to be an input
                                    // but input doesn't support rendering custom children
                                    // so we use a button instead and add a fake method to prevent errors
                                    element['setSelectionRange'] = noop;
                                }

                                const ref: any = propsAutocomplete.ref;

                                ref(element);
                            }}
                            style={this.props.disabled ? {...baseButtonStyle, opacity: 0.6} : baseButtonStyle}
                        >
                            {
                                this.props.value === undefined
                                    ? this.props.placeholder
                                    : this.props.renderItem(selectedItem)
                            }
                            <div style={arrowDownStyles} />
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
