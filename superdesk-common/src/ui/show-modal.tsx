import * as React from 'react';
import * as ReactDOM from 'react-dom';

export const showModal = (
    Component: React.ComponentType<{closeModal(): void}>,
    containerClass?: string,
): Promise<void> => {
    const el = document.createElement('div');

    if (containerClass != null) {
        el.className = containerClass;
    }

    document.body.appendChild(el);

    const closeModal = () => {
        ReactDOM.unmountComponentAtNode(el);
        el.remove();
    };

    ReactDOM.render(
        (
            <Component closeModal={closeModal} />
        ),
        el,
    );

    return Promise.resolve();
};
