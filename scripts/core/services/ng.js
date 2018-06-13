import {waitUntil} from 'core/helpers/waitUtil';
let $injector = null;

/**
 * @class
 * @name ProviderService
 * @description Returns a singleton that is used to access the Angular
 * application's injector. In order for this service to work, the application
 * must register the $injector (ideally via a .run clause) after loading.
 */
export default new class ProviderService {
    /**
     * @name ProviderService#register
     * @param {Object} injector The Angular $injector
     * @description Register an injector
     */
    register(injector) {
        $injector = injector;
    }

    /**
     * @name ProviderService#get
     * @param {string} name The name of the service to retrieve from the $injector.
     * @description Gets the given service from the injector. If a mock has been set
     * up for it, it returns that instead.
     */
    get(name) {
        if ($injector === null) {
            throw 'ng: $injector not registered for core/services/ng';
        }

        return $injector.get(name);
    }

    getService(name) {
        return this.getServices([name]).then((res) => res[0]);
    }
    getServices(names) {
        return new Promise((resolve, reject) => {
            waitUntil(() => $injector != null)
                .then(() => {
                    resolve(names.map((name) => $injector.get(name)));
                });
        });
    }
}();
