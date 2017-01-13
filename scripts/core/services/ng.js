let $injector = null;

export default new class ProviderService {
    register(injector) {
        $injector = injector;
    }

    get(name) {
        if ($injector === null) {
            throw 'ng: $injector not registered for core/services/ng';
        }

        return $injector.get(name);
    }
}();
