/* eslint-disable indent */

import * as React from 'react';
import * as Autocomplete from 'react-autocomplete';
import {noop, throttle} from 'lodash';
import {gettext} from 'core/utils';

interface IProps<T> {
    items: {[key: string]: T};
    value?: string;
    placeholder?: JSX.Element;
    disabled?: boolean;
    required?: boolean;
    loading?: boolean;
    renderItem(item: T): JSX.Element;
    getItemValue(item: T): string;
    onSelect(value: string): void;
    onSearch?(search: string): Promise<any>;

    // dropdown may be hidden until user starts typing in order to prevent it covering other UI elements
    autoFocus?: boolean | {initializeWithDropdownHidden: boolean};
    'data-test-id'?: string;
}

interface IState {
    search: string;
    isOpen: boolean;
    maxHeight: number;
    justInitialized: boolean;
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
};

const menuStyle = {
    ...menuStyleDefault,
    zIndex: 3, // without z-index, items that have opacity set, appear on top of the menu
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
    private search: (search: string) => void;
    private wrapper: HTMLDivElement;
    handleClosing: (e: Event) => void;

    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            search: '',
            maxHeight: 200,
            isOpen: (() => {
                if (this.props.autoFocus == null) {
                    return false;
                } else if (typeof this.props.autoFocus === 'boolean') {
                    return this.props.autoFocus;
                } else {
                    return true;
                }
            })(),
            justInitialized: true,
        };

        const searchFn = (search: string) => {
            const doSearch = () => this.props.onSearch(search);

            if (this.state.justInitialized === true) {
                this.setState({justInitialized: false}, doSearch);
            } else {
                doSearch();
            }
        };

        this.search = throttle(searchFn, 300, {leading: false});

        this.handleClosing = (e: Event) => {
            // capture all scroll events and close autocomplete on scroll
            // unless that scroll event is coming from the autocomplete itself
            const {target} = e;

            if (this.state.isOpen === true && target instanceof Node && !this.wrapper.contains(target)) {
                this.setState({isOpen: false});
            }
        };
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleClosing, true);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleClosing, true);
    }

    render() {
        return (
            <div ref={(el) => {
                this.wrapper = el;
            }}>
                <Autocomplete.default
                    open={this.state.isOpen}
                    onMenuVisibilityChange={(isOpen) => {
                        // setTimeout is required for the following reasons:
                        // 1. to wait for the wrapper to be set
                        // 2. for event listeners to respond when buttons are clicked outside of a focused select

                        const timeout = 200; // smaller values don't work for point 2 above

                        setTimeout(() => {
                            if (this.wrapper != null) {
                                // if there's no spacing, it looks glued to the bottom
                                // and it's not clear that the dropdown is scrolled independently from the rest of the page
                                const spacing = 20;

                                const remainingAtTheBottom =
                                    window.innerHeight - this.wrapper.getBoundingClientRect().bottom - spacing;
                                const oneThirdViewportHeigh = window.innerHeight / 3;

                                this.setState({
                                    isOpen,
                                    maxHeight: Math.min(remainingAtTheBottom, oneThirdViewportHeigh),
                                });
                            }
                        }, timeout);
                    }}
                    value={this.props.value}
                    items={Object.values(this.props.items)}
                    wrapperStyle={{width: '100%'}}
                    wrapperProps={{'data-test-id': this.props['data-test-id']} as any}
                    renderMenu={(items, value, style) => {
                        const hideOptions =
                            this.state.justInitialized
                            && typeof this.props.autoFocus === 'object'
                            && this.props.autoFocus.initializeWithDropdownHidden === true
                                ? {display: 'none'}
                                : {};

                        return (
                            <div style={{...style, ...menuStyle, ...hideOptions, maxHeight: this.state.maxHeight}}>
                                {
                                    this.props.loading === true
                                        ? <div style={{padding: 10}}>{gettext('Loading...')}</div>
                                        : items.length < 1
                                        ? <div style={{padding: 10}}>{gettext('No items found.')}</div>
                                        : items
                                }
                            </div>
                        );
                    }}
                    renderInput={(propsAutocomplete: any) => {
                        const selectedItem = this.props.items[this.props.value];

                        if (propsAutocomplete['aria-expanded'] === true) {
                            return (
                                <input
                                    {...propsAutocomplete}
                                    onChange={(event) => {
                                        const value = event.target.value;

                                        this.setState({search: value});
                                        this.search(value);
                                    }}
                                    value={this.state.search}
                                    style={{height: this.lastButtonHeight + 'px'}}
                                    placeholder={'Search'}
                                    autoFocus
                                    data-test-id="filter-input"
                                />
                            );
                        }

                        const baseButtonStyle = {padding: 0};

                        return (
                            <div style={{display: 'flex', alignItems: 'center'}}>
                                <div style={{flexGrow: 1}}>
                                    <button
                                        {...propsAutocomplete}
                                        type="button"
                                        className="sd-line-input__select-custom"
                                        disabled={this.props.disabled}
                                        onClick={() => this.setState({isOpen: !this.state.isOpen})}
                                        ref={(element) => {
                                            if (element != null) {
                                                this.lastButtonHeight = element.offsetHeight;

                                                // react-autocomplete expects ref to be an input
                                                // but input doesn't support rendering custom children
                                                // so we use a button instead and add a fake method to prevent errors
                                                // Also, we need to manage the open/close logic on our own
                                                element['setSelectionRange'] = noop;
                                            }

                                            const ref: any = propsAutocomplete.ref;

                                            ref(element);
                                        }}
                                        style={
                                            this.props.disabled ? {...baseButtonStyle, opacity: 0.6} : baseButtonStyle
                                        }
                                        data-test-id="dropdown-button"
                                    >
                                        {
                                            this.props.value === undefined || selectedItem == null
                                                ? (
                                                    <div style={{marginLeft: -8}}>
                                                        {this.props.placeholder}
                                                    </div>
                                                )
                                                : (
                                                    <div style={{marginLeft: -8}}>
                                                        {this.props.renderItem(selectedItem)}
                                                    </div>
                                                )
                                        }
                                        <div style={arrowDownStyles} />
                                    </button>
                                </div>

                                {
                                    this.props.disabled || this.props.required || this.props.value == null ? null : (
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    this.props.onSelect(null);
                                                }}
                                                className="btn btn--small btn--icon-only-circle"
                                                style={{marginLeft: 20}}
                                            >
                                                <i className="icon-close-small" />
                                            </button>
                                        </div>
                                    )
                                }
                            </div>
                        );
                    }}
                    getItemValue={this.props.getItemValue}
                    onSelect={this.props.onSelect}
                    renderItem={(item: T, isHighlighted) => {
                        const commonStyles: React.CSSProperties = {
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: 0,
                            background: 'white',
                        };
                        const style: React.CSSProperties = isHighlighted
                            ? {...commonStyles, cursor: 'pointer', background: '#eff7fa'}
                            : commonStyles;

                        return (
                            <button
                                key={this.props.getItemValue(item)}
                                type="button"
                                style={style}
                                data-test-id="option"
                            >
                                {this.props.renderItem(item)}
                            </button>
                        );
                    }}
                />
            </div>
        );
    }
}
