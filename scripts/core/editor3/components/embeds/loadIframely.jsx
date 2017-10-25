// see https://iframely.com/docs/reactjs and https://gist.github.com/nleush/7e7775c9709eb3bdb6e6
export function loadIframelyEmbedJs() {
    var iframely = window.iframely = window.iframely || {};
    var widgets = iframely.widgets = iframely.widgets || {};

    if (widgets.load) {
        widgets.load();
    } else {
        var ifs = document.createElement('script');
        var s = document.getElementsByTagName('script')[0];

        if (typeof s === 'undefined') {
            return; // happens in tests
        }

        ifs.type = 'text/javascript';
        ifs.async = true;
        ifs.src = (document.location.protocol === 'https:' ? 'https:' : 'http:') + '//cdn.iframe.ly/embed.js';

        s.parentNode.insertBefore(ifs, s);
    }
}
