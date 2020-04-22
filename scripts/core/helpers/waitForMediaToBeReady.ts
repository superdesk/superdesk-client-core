import {isImage, isAudio, isVideo} from './utils';
import {logger} from 'core/services/logger';

/**
 * @param elements An array of img, audio and video elements
 */
export const waitForMediaToLoad = (
    elements: Array<HTMLImageElement | HTMLAudioElement | HTMLVideoElement>,
): Promise<void> =>
    new Promise((resolve) => {
        const filteredElements = elements.filter((element) => {
            if (isImage(element)) {
                return element.complete === false;
            } else if (isAudio(element) || isVideo(element)) {
                return element.readyState < 1;
            } else {
                logger.error(new Error('Unexpected element type'));
                return false;
            }
        });
        let itemsLeftToLoad: number = filteredElements.length;

        if (itemsLeftToLoad === 0) {
            resolve();
            return;
        }

        const eventHandler = (event?) => {
            itemsLeftToLoad--;

            if (itemsLeftToLoad === 0) {
                resolve();
            }
        };

        filteredElements.forEach((element) => {
            if (isImage(element)) {
                // check for error in image src
                element.addEventListener('error', eventHandler, {once: true});
                element.addEventListener('load', eventHandler, {once: true});
            } else if (isAudio(element) || isVideo(element)) {
                // for audio and video check for the error in source
                const source = element.getElementsByTagName('source')[0];

                if (!source) {
                    // Streamed videos don't have a <source> tag
                    return eventHandler();
                }

                source.addEventListener('error', eventHandler, {once: true});
                element.addEventListener('loadedmetadata', eventHandler, {
                    once: true,
                });
            }
        });
    });
