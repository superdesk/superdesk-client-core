import {ElementFinder, by} from 'protractor';
import {hover, el} from './index';

export function executeContextMenuAction(articleItem: ElementFinder, action: string) {
    hover(articleItem);

    el(['context-menu-button'], null, articleItem).click();

    const button = el(['context-menu']).element(by.buttonText(action));
    const link = el(['context-menu']).element(by.linkText(action));

    button.isPresent().then((present) => {
        if (present === true) {
            return button.click();
        } else {
            return link.click();
        }
    });
}
