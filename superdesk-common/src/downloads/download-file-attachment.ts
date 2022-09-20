/**
 * Only use this function if server sets a response header
 * `Content-Disposition` to `attachment` and provides a file name.
 */
export function downloadFileAttachment(url: string) {
    const link = document.createElement('a');

    link.href = url;
    link.click();
}
