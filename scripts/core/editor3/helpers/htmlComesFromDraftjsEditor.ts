export const htmlComesFromDraftjsEditor = (html: string, allowTables = true) => {
    const tree = new DOMParser().parseFromString(html, 'text/html');

    return tree.querySelector('[data-offset-key]') != null && (
        allowTables || tree.getElementsByClassName('table-inside').length === 0
    );
};
