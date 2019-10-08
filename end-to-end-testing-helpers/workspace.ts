import {el} from "./index";

export function navigateTo(destination: string) {
    el(['workspace-navigation', destination]).click();
}
