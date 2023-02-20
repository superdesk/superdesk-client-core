import React, {ReactNode} from 'react';
import {Placement} from '@popperjs/core';
import {showPopup} from 'core/ui/components/popupNew';

interface IProps {
    children(toggle: (referenceElement: HTMLElement) => void): ReactNode;
    placement: Placement;
    component: React.ComponentType<{closePopup(): void}>;
    zIndex?: number;
    closeOnHoverEnd?: boolean;
    onClose?: () => void;
}

export class WithPopover extends React.PureComponent<IProps> {
    private closePopup?: () => void;

    constructor(props: IProps) {
        super(props);

        this.togglePopup = this.togglePopup.bind(this);
    }

    togglePopup(referenceElement: HTMLElement) {
        if (this.closePopup != null) {
            this.closePopup();
            this.closePopup = undefined;
        } else {
            this.closePopup = showPopup(
                referenceElement,
                this.props.placement,
                this.props.component,
                this.props.zIndex,
                this.props.closeOnHoverEnd,
                this.props.onClose,
            ).close;
        }
    }

    render(): React.ReactNode {
        return this.props.children(this.togglePopup);
    }
}
