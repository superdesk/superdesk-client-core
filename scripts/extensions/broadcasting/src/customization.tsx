import {IRundownItemBase} from './interfaces';

export interface ICustomizations {
    getRundownItemDisplayName?: (rundownItem: IRundownItemBase) => string;
}

export const customizations: ICustomizations = {};

export function setCustomizations(_customizations: ICustomizations) {
    Object.assign(customizations, _customizations);
}
