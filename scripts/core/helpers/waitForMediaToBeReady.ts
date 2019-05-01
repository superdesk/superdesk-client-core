/**
 * @param {Array<Node>} elements
 * @param {string} eventName
 */
const waitForEventToFireForAllElements = (elements, eventName) => new Promise((resolve) => {
    let itemsLeftToLoad = elements.length;

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

/**
 * @param {Array<Node>} elements
 */
export const waitForImagesToLoad =
    (elements) => waitForEventToFireForAllElements(elements.filter((img) => img.complete === false), 'load');

/**
 * @param {Array<Node>} elements
 */
export const waitForAudioAndVideoToLoadMetadata =
    (elements) => waitForEventToFireForAllElements(elements.filter((media) => media.readyState < 1), 'loadedmetadata');
