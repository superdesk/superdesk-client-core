import {ContentState} from 'draft-js';

export const getBlockKeys = (contentState: ContentState, start: string, end: string) =>
    [contentState
        .getBlockMap()
        .keySeq()
        .skipUntil((k) => k === start)
        .takeUntil((k) => k === end),
    end,
    ];
