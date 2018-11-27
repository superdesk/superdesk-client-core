// see https://iframely.com/docs/reactjs and https://gist.github.com/nleush/7e7775c9709eb3bdb6e6
let loaded = false;

export function loadIframelyEmbedJs() {
    const iframely = window['iframely'] = window['iframely'] || {};
    const widgets = iframely.widgets = iframely.widgets || {};

    if (widgets.load) {
        widgets.load();
    } else if (!loaded) {
        loaded = true;

        const ifs = document.createElement('script');
        const s = document.getElementsByTagName('script')[0];

        if (typeof s === 'undefined') {
            return; // happens in tests
        }

        ifs.type = 'text/javascript';
        ifs.async = true;
        ifs.src = (document.location.protocol === 'https:' ? 'https:' : 'http:') + '//cdn.iframe.ly/embed.js';

        s.parentNode.insertBefore(ifs, s);
    }
}
