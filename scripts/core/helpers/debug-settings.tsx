interface IDebugSettings {
    logDisplayPriorities: boolean;
}

export function hasDebugSetting(option: keyof IDebugSettings) {
    const settings: IDebugSettings = JSON.parse(localStorage.getItem('debug'));

    return settings != null && settings[option] === true;
}
