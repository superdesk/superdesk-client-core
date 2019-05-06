/**
 * @param elements An array of img, audio and video elements
 * @param eventName EventListener's name
 */
export const waitForMediaToLoad = (elements: Array<any>, eventName: string): Promise<void> => new Promise((resolve) => {
    let itemsLeftToLoad: number = elements.length;

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

    elements.forEach((element) => {
        // check for error in image src
        if (element.tagName === 'IMG') {
            element.addEventListener('error', eventHandler, {once: true});
        } else {
            // for audio and video check for the error in source
            const source = element.getElementsByTagName('source')[0];

            source.addEventListener('error', eventHandler, {once: true});
        }
        element.addEventListener(eventName, eventHandler);
    });
});
