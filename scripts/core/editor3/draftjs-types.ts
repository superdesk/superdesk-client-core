import {SelectionState, ContentBlock} from "draft-js";

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
    decoratedText: string;
    offsetKey: string;
    children: Array<React.ReactElement<IPropsDecoratorChild>>;
}
