import React from 'react';
import classNames from 'classnames';
import {createPopper, Modifier, Instance as PopperInstance} from '@popperjs/core/';
import maxSize from 'popper-max-size-modifier';
import {isScrolledIntoViewVertically} from 'core/utils';

const sameWidth: Modifier<any, any> = {
    name: 'sameWidth',
    enabled: true,
    phase: 'beforeWrite',
    requires: ['computeStyles'],
    fn: ({state}) => {
        state.styles.popper.width = `${state.rects.reference.width}px`;
    },
    effect: ({state}) => {
        const {reference} = state.elements;

        if (reference instanceof HTMLElement) {
            state.elements.popper.style.width = `${reference.offsetWidth}px`;
        }
    },
};

const applyMaxSize: Modifier<any, any> = {
    name: 'applyMaxSize',
    enabled: true,
    phase: 'beforeWrite',
    requires: ['maxSize'],
    fn: ({state}) => {
        const {height} = state.modifiersData.maxSize;

        // subtracting 10 in order to make a gap between the edge of the viewport
        state.styles.popper.maxHeight = `${height - 10}px`;
    },
};

// Default "flip" modifier doesn't work well with "applyMaxSize"
const flipCustomModifier: Modifier<any, any> = {
    name: 'flipCustom',
    enabled: true,
    phase: 'main',
    fn: ({state}) => {
        if (state.placement === 'bottom') {
            const availableSpaceAtTheBottom =
                document.documentElement.clientHeight
                - (state.rects.reference.y + state.rects.reference.height);

            if (availableSpaceAtTheBottom < 120) {
                state.placement = 'top';
                state.reset = true;
            }
        }
    },
};

interface IProps {
    referenceNode: HTMLElement;
    items: Array<string>;
    onClick(item): void;
    className?: string;
}

interface IState {
    selectedIndex: number;
    visible: boolean;
}

/**
 * Renders autocomplete suggestions without controlling the input field.
 * Can be used to implement autocomplete for custom editors, for example draftjs.
 */
export class AutocompleteSuggestions extends React.PureComponent<IProps, IState> {
    private returnTo: HTMLElement;
    private _mounted: boolean;
    private el: HTMLDivElement;
    private popper: PopperInstance;

    constructor(props: IProps) {
        super(props);

        this.state = {
            selectedIndex: -1,
            visible: true,
        };

        this.handleSelect = this.handleSelect.bind(this);
        this.focusLeave = this.focusLeave.bind(this);
    }

    handleSelect(index) {
        this.props.onClick(this.props.items[index]);

        setTimeout(() => {
            this.focusLeave();
        });
    }

    focusLeave() {
        this.returnTo?.focus();

        if (this._mounted) {
            this.setState({selectedIndex: -1, visible: false});
        }
    }

    componentDidMount() {
        this._mounted = true;

        this.popper = createPopper(
            this.props.referenceNode,
            this.el,
            {
                placement: 'bottom',
                modifiers: [sameWidth, maxSize, applyMaxSize, flipCustomModifier],
            });
    }

    componentDidUpdate() {
        const selectedOptionElement = this.el?.querySelector('[aria-selected=true]');

        if (
            selectedOptionElement instanceof HTMLElement
            && this.el != null
            && isScrolledIntoViewVertically(selectedOptionElement, this.el) === false
        ) {
            selectedOptionElement.scrollIntoView();
        }
    }

    componentWillUnmount() {
        this.popper.destroy();
        this._mounted = false;
    }

    render() {
        if (this.state.visible !== true) {
            return null;
        }

        return (
            <div
                role="listbox"
                aria-expanded={true}
                className={this.props.className}
                tabIndex={-1}
                onFocus={(event) => {
                    this.returnTo = event.relatedTarget as HTMLElement;

                    this.setState({selectedIndex: 0});
                }}
                onBlur={(event) => {
                    if (!(event.relatedTarget instanceof HTMLElement) || !event.target.contains(event.relatedTarget)) {
                        this.setState({visible: false});
                    }
                }}
                ref={(el) => {
                    this.el = el;
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        this.focusLeave();
                    } else if (event.key === 'ArrowDown') {
                        event.preventDefault(); // prevent bubbling triggering scroll

                        this.setState({
                            selectedIndex: Math.min(this.state.selectedIndex + 1, this.props.items.length - 1),
                        });
                    } else if (event.key === 'ArrowUp') {
                        event.preventDefault(); // prevent bubbling triggering scroll

                        this.setState({
                            selectedIndex: Math.max(this.state.selectedIndex - 1, 0),
                        });
                    } else if (event.key === 'Enter') {
                        event.preventDefault(); // prevent bubbling triggering newline
                        this.handleSelect(this.state.selectedIndex);
                    }
                }}
            >
                {
                    this.props.items.map((value, i) => {
                        const selected = i === this.state.selectedIndex;

                        return (
                            <button
                                key={value}
                                aria-selected={selected}
                                className={classNames('item', {selected})}
                                onClick={() => {
                                    this.handleSelect(i);
                                }}
                            >
                                {value}
                            </button>
                        );
                    })
                }
            </div>
        );
    }
}
