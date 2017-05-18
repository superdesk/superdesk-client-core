import {toHTML} from 'core/editor3/html';
import {convertFromRaw} from 'draft-js';

// eslint-disable-next-line no-undef
onmessage = ({data}) => {
    const content = convertFromRaw(data.rawContent);
    const html = toHTML(content);

    postMessage({html});
};
