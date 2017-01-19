let $injector = null;

/**
 * @class
 * @name ProviderService
 * @description Returns a singleton that is used to access the Angular
 * application's injector. In order for this service to work, the application
 * must register the $injector (ideally via a .run clause) after loading.
 */
export default new class ProviderService {
    constructor() {
        this.mocks = {};
    }

    /**
     * @name ProviderService#register
     * @param {Object} injector The Angular $injector
     * @description Register an injector
     */
    register(injector) {
        $injector = injector;
    }

    /**
     * @name ProviderService#mock
     * @param {string} service The service to mock.
     * @param {Object} form The form this service takes as a mock. This is the
     * value that is returned by get when this service is asked for. Do not forget
     * to unmock after tests.
     * @description Sets up a new mock for a given service.
     */
    mock(service, form) {
        this.mocks[service] = form;
    }

    /**
     * @name ProviderService#unmock
     * @param {string} service The service to remove the mock for.
     * @description Removes the mock for the given service.
     */
    unmock(service) {
        delete this.mocks[service];
    }

    /**
     * @name ProviderService#get
     * @param {string} name The name of the service to retrieve from the $injector.
     * @description Gets the given service from the injector. If a mock has been set
     * up for it, it returns that instead.
     */
    get(name) {
        if (this.mocks.hasOwnProperty(name)) {
            return this.mocks[name];
        }

        if ($injector === null) {
            throw 'ng: $injector not registered for core/services/ng';
        }

        return $injector.get(name);
    }
}();
