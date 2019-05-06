/**
 * @param elements An array of img, audio and video elements
 */
export const waitForMediaToLoad = (elements: Array<Element>): Promise<void> => new Promise((resolve) => {
    // EventListener's name
    let eventName: string = 'load';

    const filteredElelemnts = elements.filter((element: Element) => {
        if (element.tagName === 'IMG') {
            return element.complete === false;
        }
        return element.readyState < 1;
    });
    let itemsLeftToLoad: number = filteredElelemnts.length;

    if (itemsLeftToLoad === 0) {
        resolve();
        return;
    }

    const eventHandler = (event) => {
        itemsLeftToLoad--;
        event.target.removeEventListener(eventName, eventHandler);

        if (itemsLeftToLoad === 0) {
            resolve();
        }
    };

    filteredElelemnts.forEach((element: Element) => {
        if (element.tagName === 'IMG') {
            // check for error in image src
            element.addEventListener('error', eventHandler, {once: true});
        } else {
            eventName = 'loadedmetadata';
            // for audio and video check for the error in source
            const source = element.getElementsByTagName('source')[0];

            source.addEventListener('error', eventHandler, {once: true});
        }
        element.addEventListener(eventName, eventHandler);
    });
});
