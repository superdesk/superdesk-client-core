function isLinkExternal(href) {
    try {
        return new URL(href).host !== window.location.host;
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