export const getBlockKeys = (contentState, start, end) => [
    ...contentState
        .getBlockMap()
        .keySeq()
        .skipUntil((k) => k === start)
        .takeUntil((k) => k === end),
    end,
];
