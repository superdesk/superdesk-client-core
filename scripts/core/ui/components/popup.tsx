import React from 'react';
import ReactDOM from 'react-dom';
import {throttle, once} from 'lodash';
import {createPopper, Instance as PopperInstance, Placement} from '@popperjs/core/';
import maxSize from 'popper-max-size-modifier';
import {applyMaxSize} from './AutoCompleteSuggestions';

interface IPropsPositioner {
    referenceElement: HTMLElement;
    placement: Placement;
    zIndex?: number;
    onClose(): void;
}

class PopupPositioner extends React.PureComponent<IPropsPositioner> {
    private wrapperEl: HTMLDivElement;
    private positionOnce: (el: HTMLElement) => void;
    private popper: PopperInstance;

    constructor(props: IPropsPositioner) {
        super(props);

        this.closeOnClick = this.closeOnClick.bind(this);
        this.closeOnScroll = throttle(this.closeOnScroll.bind(this), 200);
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

    componentDidMount() {
        window.addEventListener('click', this.closeOnClick);
        window.addEventListener('scroll', this.closeOnScroll, true);

        if (this.wrapperEl != null) {
            this.popper = createPopper(
                this.props.referenceElement,
                this.wrapperEl,
                {
                    placement: this.props.placement,
                    modifiers: [maxSize, applyMaxSize],
                },
            );
        }
    }

    componentWillUnmount() {
        window.removeEventListener('click', this.closeOnClick);
        window.removeEventListener('scroll', this.closeOnScroll, true);

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
