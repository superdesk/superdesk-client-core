import React from 'react';
import ReactDOM from 'react-dom';
import {throttle} from 'lodash';
import {createPopper, Instance as PopperInstance, Placement} from '@popperjs/core/';
import maxSize from 'popper-max-size-modifier';
import {applyMaxSize} from './AutoCompleteSuggestions';

interface IPropsPositioner {
    referenceElement: HTMLElement;
    placement: Placement;
    zIndex?: number;
    onClose(): void;
    closeOnHoverEnd?: boolean;
}

class PopupPositioner extends React.PureComponent<IPropsPositioner> {
    private wrapperEl: HTMLDivElement;
    private popper: PopperInstance;

    constructor(props: IPropsPositioner) {
        super(props);

        this.closeOnClick = this.closeOnClick.bind(this);
        this.closeOnScroll = throttle(this.closeOnScroll.bind(this), 200);
        this.closeOnMouseLeave = this.closeOnMouseLeave.bind(this);
    }

    closeOnClick(event: MouseEvent) {
        if (this.wrapperEl == null) {
            return;
        }

        if (
            this.props.referenceElement.contains(event.target as Node) !== true
            && this.wrapperEl.contains(event.target as Node) !== true
        ) {
            this.props.onClose();
        }
    }

    closeOnScroll(event: MouseEvent) {
        if (this.wrapperEl == null) {
            return;
        }

        if (this.wrapperEl.contains(event.target as Node) !== true) {
            this.props.onClose();
        }
    }

    closeOnMouseLeave(event: MouseEvent) {
        if (this.wrapperEl == null) {
            return;
        }

        if (this.wrapperEl.contains(event.target as Node) !== true) {
            this.props.onClose();
        }
    }

    componentDidMount() {
        window.addEventListener('click', this.closeOnClick, {capture: true});
        window.addEventListener('scroll', this.closeOnScroll, true);

        if (this.props.closeOnHoverEnd && this.wrapperEl != null) {
            this.props.referenceElement.addEventListener('mouseleave', this.closeOnMouseLeave);
            this.wrapperEl.addEventListener('mouseleave', this.closeOnMouseLeave);
        }

        if (this.wrapperEl != null) {
            /**
             * Wait until referenceElement renders so createPopper
             * can take its dimensions into account.
             */
            setTimeout(() => {
                this.popper = createPopper(
                    this.props.referenceElement,
                    this.wrapperEl,
                    {
                        placement: this.props.placement,
                        modifiers: [
                            maxSize,
                            applyMaxSize,
                        ],
                    },
                );
            }, 50);
        }
    }

    componentWillUnmount() {
        window.removeEventListener('click', this.closeOnClick);
        window.removeEventListener('scroll', this.closeOnScroll, true);

        if (this.props.closeOnHoverEnd && this.wrapperEl != null) {
            this.props.referenceElement.removeEventListener('mouseleave', this.closeOnMouseLeave);
            this.wrapperEl.removeEventListener('mouseleave', this.closeOnMouseLeave);
        }

        this.popper.destroy?.();
    }

    render() {
        return (
            <div
                ref={(el) => {
                    this.wrapperEl = el;
                }}
                style={{zIndex: this.props.zIndex ?? 1}}
            >
                {this.props.children}
            </div>
        );
    }
}

/**
 * The popup will remove itself if click/scroll events are detected outside the popup.
 */
export function showPopup(
    referenceElement: HTMLElement,
    placement: Placement,
    Component: React.ComponentType<{closePopup(): void}>,
    zIndex?: number,
    closeOnHoverEnd?: boolean,
) {
    const el = document.createElement('div');

    document.body.appendChild(el);

    const onClose = () => {
        ReactDOM.unmountComponentAtNode(el);
        el.remove();
    };

    ReactDOM.render(
        (
            <PopupPositioner
                referenceElement={referenceElement}
                placement={placement}
                onClose={onClose}
                zIndex={zIndex}
                closeOnHoverEnd={closeOnHoverEnd || false}
            >
                <Component
                    closePopup={onClose}
                />
            </PopupPositioner>
        ),
        el,
    );

    return Promise.resolve();
}
