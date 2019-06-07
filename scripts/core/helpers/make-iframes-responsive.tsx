// to make iframes responsive, we remove width/height from the iframe itself
// and add a wrapper element with percent padding proportional to aspect ratio calculated from
// iframe's width/height properties
export function makeIframesResponsive(
    html: string, // coming from user input, can't make assumptions about structure
): string {
    var el = document.createElement('div');

    el.innerHTML = html;

    el.querySelectorAll('iframe').forEach((iframeElement) => {
        let iframeWidth = 0;
        let iframeHeight = 0;

        try {
            if (iframeElement.width != null && iframeElement.height != null) {
                iframeWidth = parseInt(iframeElement.width, 10);
                iframeHeight = parseInt(iframeElement.height, 10);
            }
        } catch (e) {
            // do nothing
        }

        const wrapperStyles = `position: relative; overflow: hidden; padding-top: ${iframeHeight / iframeWidth * 100}%`;

        if (iframeWidth > 0 && iframeHeight > 0) {
            iframeElement.removeAttribute('width');
            iframeElement.removeAttribute('height');

            iframeElement.style.position = 'absolute';
            iframeElement.style.top = '0';
            iframeElement.style.left = '0';
            iframeElement.style.width = '100%';
            iframeElement.style.height = '100%';
            iframeElement.style.border = '0';

            iframeElement.outerHTML = `<div style="${wrapperStyles}">${iframeElement.outerHTML}</div>`;
        }
    });

    return el.innerHTML;
}
