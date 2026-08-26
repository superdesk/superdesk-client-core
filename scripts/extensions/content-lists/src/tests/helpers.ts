import {mount, ReactWrapper} from 'enzyme';
import * as ReactDOM from 'react-dom';

/**
 * Waits until all promise callbacks queued so far (and those they queue in
 * turn) have run; used to let components finish `componentDidMount` fetches.
 */
export function flushPromises(): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}

const mounted: Array<{wrapper: ReactWrapper; container: HTMLElement}> = [];

let bodyChildrenBeforeSpec: Set<Element> = new Set();

/**
 * Like enzyme's `mount`, but attached to the document (react-beautiful-dnd
 * needs rendered drag handles to be in the DOM) and unmounted automatically
 * after each spec.
 */
export function mountWithCleanup(element: React.ReactElement): ReactWrapper {
    const container = document.createElement('div');

    document.body.appendChild(container);

    const wrapper = mount(element, {attachTo: container});

    mounted.push({wrapper, container});

    return wrapper;
}

beforeEach(() => {
    bodyChildrenBeforeSpec = new Set(Array.from(document.body.children));
});

afterEach(() => {
    mounted.forEach(({wrapper, container}) => {
        wrapper.unmount();
        container.remove();
    });
    mounted.length = 0;

    // remove leftovers rendered straight into the body during the spec,
    // e.g. modals opened via showModal from @sourcefabric/common
    Array.from(document.body.children).forEach((element) => {
        if (!bodyChildrenBeforeSpec.has(element)) {
            ReactDOM.unmountComponentAtNode(element);
            element.remove();
        }
    });
});
