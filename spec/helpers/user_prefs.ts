import {nav, wait} from './utils';
import {by, element, $, $$} from 'protractor';

/**
 * A helper for working with the user preference settings located in the
 * User Profile section.
 */
class UserPrefs {
    btnSave: any;
    btnCancel: any;
    prefsTab: any;
    btnCheckNone: any;
    categoryCheckboxes: any;
    privlTab: any;
    privlCheckboxes: any;
    setLang: (lang: any) => void;
    save: () => void;
    navigateTo: () => any;

    constructor() {
        this.btnSave = $('.action-bar').element(by.buttonText('Save'));
        this.btnCancel = $('.action-bar').element(by.buttonText('Cancel'));

        // the Preferences tab
        this.prefsTab = element.all(by.css('.nav-tabs button')).get(1);

        this.btnCheckNone = element.all(by.css('.preferences__actions > a')).get(1);
        this.categoryCheckboxes = element.all(
            by.repeater('cat in categories')).all(by.css('.sd-checkbox'));

        // the Privileges tab
        this.privlTab = element.all(by.css('.nav-tabs button')).get(2);

        this.privlCheckboxes = $$('table input[type="checkbox"]');

        // the Profile tab (Overview);
        this.setLang = function(lang) {
            element(by.css('[name="user_language"]'))
                .element(by.cssContainingText('option', lang))
                .click();
        };

        this.save = () => {
            wait(this.btnSave, 3000);
            this.btnSave.click();

            const ok = element(by.className('modal__footer')).element(by.className('btn--primary'));

            ok.isDisplayed().then((click) => {
                if (click) {
                    ok.click();
                }
            });
        };

        this.navigateTo = function() {
            return nav('/profile');
        };
    }
}

export default new UserPrefs();
