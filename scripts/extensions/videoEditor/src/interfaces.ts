export interface ICrop {
    x: number;
    y: number;
    width: number;
    height: number;
    unit?: 'px' | '%';
    aspect?: number;
}

export interface IThumbnail {
    url: string;
    width: number;
    height: number;
}

export interface ITimelineThumbnail {
    processing: boolean;
    thumbnails: Array<IThumbnail> | [];
}

export interface IDropdownLabel {
    onClick?: () => void;
    gettext?: (text: string) => string;
    getClass?: (text: string) => string;
    title?: string | null;
    disabled?: boolean;
    selectedItem?: {
        label: string;
        value: number;
    };
}

export interface IErrorMessage {
    internal_error: number;
    _message: {
        crop: Array<string>;
        trim: Array<string>;
    };
    _status: 'ERR';
}
