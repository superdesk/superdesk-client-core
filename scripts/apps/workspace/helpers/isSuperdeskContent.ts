export const isSuperdeskContent = (type) => [
    'text',
    'audio',
    'video',
    'picture',
    'graphic',
    'composite',
].includes(type);
