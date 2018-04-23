/* eslint-disable newline-per-chained-call */

var authoring = require('./helpers/authoring'),
    monitoring = require('./helpers/monitoring'),
    nav = require('./helpers/utils').nav,
    post = require('./helpers/fixtures').post,
    userPrefs = require('./helpers/user_prefs'),
    workspace = require('./helpers/workspace');

describe('users', () => {
    beforeEach((done) => {
        post({
            uri: '/users',
            json: {
                first_name: 'foo',
                last_name: 'bar',
                username: 'spam',
                email: 'foo@bar.com',
                sign_off: 'foobar',
            },
        }, done);
    });

    describe('profile:', () => {
        beforeEach((done) => {
            nav('/profile').then(done);
        });

        it('can render user profile', () => {
            expect(bindingValue('user.username')).toBe('admin');
            expect(modelValue('user.first_name')).toBe('first name');
            expect(modelValue('user.last_name')).toBe('last name');
            expect(modelValue('user.email')).toBe('a@a.com');
            expect(modelValue('user.sign_off')).toBe('fl');
        });

        it('can save and use language preferences', () => {
            userPrefs.setLang('Deutsch');
            browser.wait(() => userPrefs.btnSave.isDisplayed(), 3000);
            userPrefs.btnSave.click();
            element(by.css('[ng-hide="currentRoute.topTemplateUrl"]')).getText().then((text) => {
                expect(text).toEqual('Mein Profil');
            });
            browser.sleep(500);
            // go back to original lanuages
            userPrefs.setLang('English');
            var btnSave = $('.action-bar').element(by.buttonText('Speichern'));

            browser.wait(() => btnSave.isDisplayed(), 3000);
            browser.sleep(200); // animation
            btnSave.click();
        });
    });

    describe('users list:', () => {
        beforeEach(() => {
            nav('/users');
        });

        it('can list users', () => {
            expect(element.all(by.repeater('user in users')).count()).toBe(6);
            expect(element(by.repeater('user in users').row(0).column('username')).getText())
                .toBe('test_user');
        });

        it('list online users', () => {
            var online = element(by.id('user-filter')).all(by.tagName('option')).get(1);

            expect(online.getText()).toBe('Online');
            online.click();
            expect(element.all(by.repeater('user in users')).count()).toBe(3);
            expect(element(by.repeater('user in users').row(0).column('username')).getText())
                .toBe('test_user');
            expect(element(by.repeater('user in users').row(1).column('username')).getText())
                .toBe('admin');
        });

        it('can disable user', () => {
            var user = element.all(by.repeater('users')).first(),
                activity = user.element(by.className('icon-trash'));

            user.waitReady()
                .then((elem) => browser.actions().mouseMove(elem).perform())
                .then(() => {
                    activity.waitReady().then((elem) => {
                        elem.click();
                    });
                });

            element(by.css('.modal__dialog')).waitReady().then((elem) => {
                browser.wait(() => elem.element(by.binding('bodyText'))
                    .getText()
                    .then((text) => {
                        if (text === 'Please confirm that you want to disable a user.') {
                            return true;
                        }
                    }), 5000);
                return elem;
            }).then((elem) => {
                browser.wait(() => {
                    try {
                        return elem.element(by.partialButtonText('OK'))
                            .click()
                            .then(() => true);
                    } catch (err) {
                        console.error(err);
                    }
                }, 5000);
            }).then(() => {
                browser.wait(() => {
                    var elem = element.all(by.repeater('users')).first().element(by.className('disabled-label'));

                    return elem.isDisplayed();
                }, 5000);
            });
        });
    });

    describe('user detail:', () => {
        beforeEach((done) => {
            nav('/users').then(done);
        });

        it('can open user detail', () => {
            element.all(by.repeater('users')).first().click();
            expect(modelValue('user.display_name'))
                .toBe('first name last name');
            $('#open-user-profile').waitReady()
                .then((elem) => {
                    elem.click();
                });
            var pageNavTitle = $('.page-nav-title');

            browser.wait(() => pageNavTitle.getText().then((text) => {
                if (text.indexOf('Users Profile') === 0) {
                    return true;
                }
            }), 2000);
            expect(pageNavTitle.getText())
                .toBe('Users Profile: first name last name');
        });
    });

    describe('user edit:', () => {
        beforeEach((done) => {
            nav('/users')
                .then(() =>
                    element(by.repeater('user in users').row(0)
                        .column('username'))
                        .waitReady())
                .then((elem) => elem.click())
                .then(() => $('#open-user-profile').waitReady()).then((elem) => elem.click()).then(done);
        });

        it('can enable/disable buttons based on form status', () => {
            var generalTab = element(by.buttonText('General info'));
            var authorsTab = element(by.buttonText('Author info'));

            var buttonSave = element(by.id('save-edit-btn'));
            var buttonCancel = element(by.id('cancel-edit-btn'));
            var inputFirstName = element(by.model('user.first_name'));
            var inputSignOff = element(by.model('user.sign_off'));

            expect(buttonSave.isEnabled()).toBe(false);
            expect(buttonCancel.isEnabled()).toBe(false);

            authorsTab.click();
            inputSignOff.clear();
            inputSignOff.sendKeys('X');
            expect(inputSignOff.getAttribute('value')).toBe('X');

            browser.sleep(200);
            expect(buttonSave.isEnabled()).toBe(true);
            expect(buttonCancel.isEnabled()).toBe(true);

            inputSignOff.clear();
            inputSignOff.sendKeys('fl');
            expect(inputSignOff.getAttribute('value')).toBe('fl');

            browser.sleep(200);
            expect(buttonSave.isDisplayed()).toBe(false);
            expect(buttonCancel.isDisplayed()).toBe(false);

            generalTab.click();
            inputFirstName.clear();

            inputFirstName.sendKeys('X');
            expect(inputFirstName.getAttribute('value')).toBe('X');

            browser.sleep(200);
            expect(buttonSave.isEnabled()).toBe(true);
            expect(buttonCancel.isEnabled()).toBe(true);

            inputFirstName.clear();
            inputFirstName.sendKeys('first name');
            expect(inputFirstName.getAttribute('value')).toBe('first name');

            browser.sleep(200);
            expect(buttonSave.isDisplayed()).toBe(false);
            expect(buttonCancel.isDisplayed()).toBe(false);
        });
    });

    describe('editing user preferences:', () => {
        beforeEach((done) => {
            userPrefs.navigateTo().then(() => userPrefs.prefsTab.click()).then(done);
        });

        it('should filter categories in the Authoring metadata head menu ' +
           'based on the user\'s preferred categories settings',
        () => {
            userPrefs.btnCheckNone.click(); // uncheck all categories

            // select the Entertainment and Finance categories
            userPrefs.categoryCheckboxes.get(3).click(); // Entertainment
            userPrefs.categoryCheckboxes.get(4).click(); // Finance

            userPrefs.btnSave.click(); // save changes

            // navigate to Workspace and create a new article
            workspace.openContent();
            authoring.navbarMenuBtn.click();
            authoring.newPlainArticleLink.click();

            // authoring opened, click the set category menu and see what
            // categories are offered
            authoring.setCategoryBtn.click();

            var catListItems = authoring.getCategoryListItems;

            expect(catListItems.count()).toBe(2);
            expect(catListItems.get(0).getText()).toEqual('Entertainment');
            expect(catListItems.get(1).getText()).toEqual('Finance');
        }
        );

        it('should filter and navigate filtered list via keyboard action in the ' +
           'Authoring metadata based on the user\'s preferred categories settings',
        () => {
            userPrefs.btnCheckNone.click(); // uncheck all categories
            browser.sleep(100);

            // select the Entertainment and Finance categories
            userPrefs.categoryCheckboxes.get(3).click(); // Entertainment
            userPrefs.categoryCheckboxes.get(4).click(); // Finance

            userPrefs.btnSave.click(); // save changes

            // navigate to Workspace and create a new article
            monitoring.openMonitoring();
            authoring.navbarMenuBtn.click();
            authoring.newPlainArticleLink.click();

            browser.sleep(100);
            // Open subject metadata dropdown field
            authoring.getCategoryMetadataDropdownOpened();
            browser.sleep(100); // wait a bit

            var catListItems = authoring.getCategoryListItems;

            expect(catListItems.count()).toBe(2);
            expect(catListItems.get(0).getText()).toEqual('Entertainment');
            expect(catListItems.get(1).getText()).toEqual('Finance');

            // now type some search term and check if down arrow navigates to filtered list
            browser.actions().sendKeys('fin').perform();
            browser.actions().sendKeys(protractor.Key.DOWN).perform();
            expect(element(by.css('.sd-typeahead li.active')).getText()).toBe('Finance');
        }
        );
        //
    });

    describe('editing user privileges:', () => {
        beforeEach((done) => {
            userPrefs.navigateTo().then(() => userPrefs.privlTab.click()).then(done);
        });

        it('should reset the form to the last saved state when the Cancel ' +
            'button is clicked',
        () => {
            var checkboxes = userPrefs.privlCheckboxes;

            // Initially all checboxes are unchecked. Now let's select
            // a few of them, click the Cancel button and see if they have
            // been reset.
            checkboxes.get(0).click(); // archive
            checkboxes.get(2).click(); // content filters
            expect(checkboxes.get(0).isSelected()).toBeTruthy();
            expect(checkboxes.get(2).isSelected()).toBeTruthy();

            userPrefs.btnCancel.click();

            expect(checkboxes.get(0).isSelected()).toBeFalsy();
            expect(checkboxes.get(2).isSelected()).toBeFalsy();

            // Check the checkboxes again, save the changes, then check a
            // few more. After clicking the Cancel button, only the
            // checkboxes checked after the save should be reset.
            checkboxes.get(0).click();
            checkboxes.get(2).click();
            expect(checkboxes.get(0).isSelected()).toBeTruthy();
            expect(checkboxes.get(2).isSelected()).toBeTruthy();

            userPrefs.btnSave.click();

            checkboxes.get(1).click(); // archived management
            checkboxes.get(4).click(); // desk management
            expect(checkboxes.get(1).isSelected()).toBeTruthy();
            expect(checkboxes.get(4).isSelected()).toBeTruthy();

            userPrefs.btnCancel.click();

            expect(checkboxes.get(0).isSelected()).toBeTruthy();
            expect(checkboxes.get(2).isSelected()).toBeTruthy();
            expect(checkboxes.get(1).isSelected()).toBeFalsy();
            expect(checkboxes.get(4).isSelected()).toBeFalsy();
        }
        );
    });

    describe('default desk field should not be visible', () => {
        beforeEach((done) => {
            nav('/users').then(done);
        });

        it('while creating a new user', () => {
            var buttonCreate = element(by.className('sd-create-btn'));

            buttonCreate.click();
            expect(element(by.id('user_default_desk')).isPresent()).toBe(false);
        });

        it('while pre-viewing and user clicks on create new user', () => {
            var buttonCreate = element(by.className('sd-create-btn'));

            element.all(by.repeater('users')).first().click();

            buttonCreate.click();
            expect(element(by.id('user_default_desk')).isPresent()).toBe(false);
        });
    });

    function bindingValue(binding) {
        return element(by.binding(binding)).getText();
    }

    function modelValue(model) {
        return element(by.model(model)).getAttribute('value');
    }
});
