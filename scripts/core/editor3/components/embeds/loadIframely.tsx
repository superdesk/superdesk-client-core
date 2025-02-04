// see https://iframely.com/docs/reactjs and https://gist.github.com/nleush/7e7775c9709eb3bdb6e6

let promise = null;

function importIframelyEmbedJs() {
    if (promise === null) {
        promise = new Promise((resolve) => {
            const embed = document.createElement('script');

            embed.type = 'text/javascript';
            embed.async = true;
            embed.onload = resolve;
            embed.src = (document.location.protocol === 'https:' ? 'https:' : 'http:') + '//cdn.iframe.ly/embed.js';

            document.body.appendChild(embed);
        });
    }

    return promise;
}

export function loadIframelyEmbedJs() {
    importIframelyEmbedJs().then(() => {
        const iframely = window.iframely = window.iframely || {};
        const widgets = iframely.widgets = iframely.widgets || {};

        if (widgets.load) {
            widgets.load();
        }
    });
}
