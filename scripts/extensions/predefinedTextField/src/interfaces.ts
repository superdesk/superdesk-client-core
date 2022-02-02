export interface IPredefinedFieldOption {
    _id: string;
    title: string;
    definition: string;
}

export interface IPredefinedFieldConfig {
    options?: Array<IPredefinedFieldOption>;
    allowSwitchingToFreeText?: boolean;
}

export interface IExtensionConfigurationOptions {
    placeholderMapping?: {[name: string]: string};
}
