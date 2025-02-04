import {Modifier, Instance as PopperInstance} from '@popperjs/core';

export const sameWidth: Modifier<any, any> = {
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

export const applyMaxSize: Modifier<any, any> = {
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

function flipVertically(placement: PopperInstance['state']['placement']): PopperInstance['state']['placement'] {
    if (placement === 'top') {
        return 'bottom';
    } else if (placement === 'bottom') {
        return 'top';
    } else if (placement === 'top-start') {
        return 'bottom-start';
    } else if (placement === 'top-end') {
        return 'bottom-end';
    } else if (placement === 'bottom-start') {
        return 'top-start';
    } else if (placement === 'bottom-end') {
        return 'top-end';
    }

    return placement;
}

// Default "flip" modifier doesn't work well with "applyMaxSize"
export const flipCustomModifier: Modifier<any, any> = {
    name: 'flipCustom',
    enabled: true,
    phase: 'main',
    fn: ({state}) => {
        if (state.placement.includes('bottom')) {
            const availableSpaceAtTheBottom =
                document.documentElement.clientHeight
                - (state.rects.reference.y + state.rects.reference.height);

            if (availableSpaceAtTheBottom < 120) {
                state.placement = flipVertically(state.placement);
                state.reset = true;
            }
        }
    },
};
