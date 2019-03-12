function isLinkExternal(href) {
    try {
        const url = new URL(href);

        // Check if the hosts are different and protocol is http or https
        return url.host !== window.location.host && ['http:', 'https:'].includes(url.protocol);
    } catch (e) {
        // will throw if string is not a valid link
        return false;
    }
}

document.addEventListener('click', (event) => {
    if (event != null) {
        const target = event.target as HTMLAnchorElement;
        if (target && target.tagName === 'A' && isLinkExternal(target.href)) {

            event.preventDefault();
            event.stopPropagation();

            // security https://mathiasbynens.github.io/rel-noopener/
            var nextWindow = window.open();

            nextWindow.opener = null;
            nextWindow.location.href = target.href;
        }
    }
});
