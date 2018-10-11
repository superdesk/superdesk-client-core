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

    const onItemLoaded = (event) => {
        itemsLeftToLoad--;
        event.target.removeEventListener(eventName, onItemLoaded);

        if (itemsLeftToLoad === 0) {
            resolve();
        }
    };

    elements.forEach((element) => {
        element.addEventListener(eventName, onItemLoaded);
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
