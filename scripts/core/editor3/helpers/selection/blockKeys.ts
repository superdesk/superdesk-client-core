export interface IContentState {
    getBlockMap: () => { keySeq: () => { skipUntil: (k: any) => { takeUntil: (k: any) => void } } };
}

export const getBlockKeys = (contentState: IContentState, start: string, end: string) =>
    [contentState
        .getBlockMap()
        .keySeq()
        .skipUntil((k) => k === start)
        .takeUntil((k) => k === end),
    end,
    ];
