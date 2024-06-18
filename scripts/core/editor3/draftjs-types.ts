import {SelectionState, ContentBlock, ContentState} from 'draft-js';

export interface IPropsDecoratorChild {
    block: ContentBlock;
    customStyleFn?: any;
    customStyleMap: {[key: string]: React.CSSProperties};
    forceSelection: boolean;
    isLast: boolean;
    offsetKey: string;
    selection: SelectionState;
    start: number;
    styleSet: any;
    text: string;
}

export interface IPropsDraftDecorator {
    blockKey: string;
    children: Array<React.ReactElement<IPropsDecoratorChild>>;
    contentState: ContentState;
    decoratedText: string;
    dir: any;
    end: number;
    entityKey: any;
    offsetKey: string;
    start: number;
}
