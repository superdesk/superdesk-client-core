export interface IActivity {
    _id: any;
    priority?: number; // priority used for ordering.
    when?: string; // $route.when param
    href?: string; // path for links generated for given activity
    filters?: Array<object>; //  list of `action` `type` pairs.
    beta?: boolean; // is activity available only in beta mode?
    reloadOnSearch?: boolean; // $route.reloadOnSearch param
    auth?: boolean; // does activity require authenticated user?
    features?: object; // map of features this activity requires
    privileges?: any;
    condition?: () => any; // method used to check if the activity is enabled for a specific item.
    label?: any;
    icon?: any;
    keyboardShortcut?: any;
    controller?: any;
    additionalCondition?: any;
    templateUrl?: any;
    modal?: any;
    cssClass?: any;
    monitor?: any;
    action?: any;
    group?: string;
    groupLabel?: any;
    groupIcon?: any;
    dropdown?: any;
}
