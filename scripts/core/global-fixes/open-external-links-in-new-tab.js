function isLinkExternal(href) {
    try {
        const url = new URL(href);

        // Check if the hosts are different, or if the href protocol is data not http
        return url.host !== window.location.host && url.protocol !== 'data:';
    } catch (e) {
        // will throw if string is not a valid link
        return false;
    }
}

document.addEventListener('click', (event) => {
    if (
        event != null
        && event.target != null
        && event.target.tagName === 'A'
        && isLinkExternal(event.target.href)
    ) {
        event.preventDefault();
        event.stopPropagation();

        // security https://mathiasbynens.github.io/rel-noopener/
        var nextWindow = window.open();

        nextWindow.opener = null;
        nextWindow.location = event.target.href;
    }
});