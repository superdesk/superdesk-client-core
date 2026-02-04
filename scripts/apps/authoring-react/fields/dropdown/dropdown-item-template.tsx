import * as React from 'react';
import {IDropdownConfig, IDropdownOption} from 'superdesk-api';
import {getTextColor} from 'core/helpers/utils';

interface IProps {
    option: IDropdownOption;
    config: IDropdownConfig;

    /**
     * Value should be the same for all options in the visual group
     * Should be true when no items in the visual group have custom background color
     */
    noPadding: boolean;
}

interface IState {
    availableWidth: number | null;
}

/**
 * This component should only be used within a `MultiSelectTreeWithTemplate` component
 */
export class DropdownItemTemplate extends React.PureComponent<IProps, IState> {
    private containerRef: React.RefObject<HTMLSpanElement>;

    constructor(props: IProps) {
        super(props);
        this.containerRef = React.createRef();
        this.state = {
            availableWidth: null,
        };
    }

    componentDidMount() {
        this.calculateAvailableWidth();
    }

    componentDidUpdate() {
        this.calculateAvailableWidth();
    }

    private calculateAvailableWidth = () => {
        const container = this.containerRef.current;

        if (container == null) {
            return;
        }

        // Find the tags-input__helper-box or tags-input__single-item container
        let widthContainer: HTMLElement | null = container.parentElement;

        while (widthContainer != null) {
            if (
                widthContainer.classList.contains('tags-input__helper-box') ||
                widthContainer.classList.contains('tags-input__single-item')
            ) {
                break;
            }

            widthContainer = widthContainer.parentElement;
        }

        if (widthContainer == null) {
            return;
        }

        const containerWidth = widthContainer.clientWidth;
        const containerStyle = window.getComputedStyle(widthContainer);
        const containerPadding = parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight);

        // Account for sibling elements (like the remove button)
        let siblingsWidth = 0;

        for (const child of Array.from(widthContainer.children)) {
            if (!child.contains(container)) {
                siblingsWidth += (child as HTMLElement).offsetWidth;
            }
        }

        const availableWidth = containerWidth - containerPadding - siblingsWidth;

        if (availableWidth !== this.state.availableWidth && availableWidth > 0) {
            this.setState({availableWidth});
        }
    };

    render() {
        const {option, noPadding, config} = this.props;
        const {availableWidth} = this.state;

        if (option == null) {
            return null;
        }

        const itemStyle: React.CSSProperties = {
            height: '1.5em',
            minWidth: '1.5em',
            maxWidth: availableWidth != null ? `${availableWidth}px` : undefined,
            backgroundColor: option.color ?? 'transparent',
            color: option.color == null ? 'black' : getTextColor(option.color),
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: config.source === 'manual-entry' && config.roundCorners ? '999px' : '2px',
            padding: noPadding ? '0' : '4px',
        };

        const labelStyle: React.CSSProperties = {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        };

        return (
            <span ref={this.containerRef} style={itemStyle}>
                <span style={labelStyle}>{option.label}</span>
            </span>
        );
    }
}
