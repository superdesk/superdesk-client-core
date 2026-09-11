/**
 * Matches a registered page URL that may contain `:param` segments
 * (e.g. `/content-lists/:id`) against the current URL path.
 */
export function matchesPageUrl(pageUrl: string, currentUrl: string): boolean {
    const pageSegments = pageUrl.split('/');
    const currentSegments = currentUrl.split('/');

    return pageSegments.length === currentSegments.length
        && pageSegments.every(
            (segment, i) => segment.startsWith(':')
                ? currentSegments[i].length > 0 // a param has to match something
                : segment === currentSegments[i],
        );
}
