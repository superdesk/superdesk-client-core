

module.exports = new LegalArchive();

var nav = require('./utils').nav;

function LegalArchive() {
    var legalArchiveMenuOption = element(by.id('main-menu')).element(by.linkText('Legal Archive'));

    this.getLegalArchiveMenuOption = function() {
        element(by.css('[ng-click="toggleMenu()"]')).click();
        return legalArchiveMenuOption;
    };

    this.open = function() {
        return nav('/legal_archive').then(() => {
            var list = element(by.className('icon-list-view'));

            return list.isDisplayed().then((isVisible) => {
                if (isVisible) {
                    list.click();
                }
            });
        });
    };
}
