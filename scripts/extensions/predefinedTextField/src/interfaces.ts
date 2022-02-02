export interface IPredefinedFieldOption {
    title: string;
    definition: string;
}

export interface IPredefinedFieldConfig {
    options: Array<IPredefinedFieldOption>;
}

export interface IExtensionConfigurationOptions {
    placeholderMapping?: {[name: string]: string};
}
