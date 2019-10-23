import {ElementFinder, by} from "protractor";
import {hover, el} from "./index";

export function executeContextMenuAction(articleItem: ElementFinder, action: string) {
    hover(articleItem);

    el(['context-menu-button'], null, articleItem).click();
    el(['context-menu']).element(by.buttonText(action)).click();
}
