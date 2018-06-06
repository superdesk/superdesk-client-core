document.addEventListener('click', (event) => {
    if (event.target.tagName === 'A' && new URL(event.target.href).host !== window.location.host) {
        event.preventDefault();
        event.stopPropagation();

        // security https://mathiasbynens.github.io/rel-noopener/
        var nextWindow = window.open();

        nextWindow.opener = null;
        nextWindow.location = event.target.href;
    }
});