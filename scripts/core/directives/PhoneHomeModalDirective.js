PhoneHomeModalDirective.$inject = ['serverConfig', 'api', 'session'];
export function PhoneHomeModalDirective(serverConfig, api, session) {
    let template = require('./views/phone-home-modal-directive.html');

    class PhoneController {
        constructor() {
            this.data = {};

            session.getIdentity().then((identity) => {
                if (identity.username === 'admin') {
                    serverConfig.get('phone_home', 'done').then((isDone) => {
                        this.enabled = !isDone;
                    });
                }
            });
        }

        close() {
            this.enabled = false;
        }

        submit() {
            serverConfig.set('phone_home', {done: 1}).then(() => {
                this.close();
            });
        }
    }

    return {
        scope: true,
        template: template,
        controller: PhoneController,
        controllerAs: 'phone',
    };
}
