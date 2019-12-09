import {Crop} from 'react-image-crop';

export interface ICrop extends Crop {
    scale?: number;
    value?: number;
}

export interface IVideoEditor {
    crop: ICrop;
    cropEnabled: boolean;
    quality: number;
    degree: number;
    playing: boolean;
}

export interface IThumbnail {
    url: string;
    width: number;
    height: number;
}

export interface IDropdownLabel {
    onClick?: () => void;
    getText?: (text: string) => string;
    title?: string | undefined;
    disabled?: boolean;
    selectedItem?: string;
}

export interface IErrorMessage {
    internal_error: number;
    _message: {
        crop: Array<string>;
        trim: Array<string>;
    };
    _status: 'ERR';
}
