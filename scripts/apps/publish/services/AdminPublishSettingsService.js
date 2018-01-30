import {transmissionTypes} from '../constants';

AdminPublishSettingsService.$inject = ['api'];
export function AdminPublishSettingsService(api) {
    var _fetch = function(endpoint, criteria) {
        return api[endpoint].query(criteria);
    };

    var service = {
        transmissionServicesMap: transmissionTypes,
        fetchPublishErrors: function() {
            var criteria = {io_type: 'publish'};

            return _fetch('io_errors', criteria);
        },
        registerTransmissionService: function(name, props) {
            this.transmissionServicesMap[name] = {
                delivery_type: name,
                label: props.label ? props.label : name,
                templateUrl: props.templateUrl ? props.templateUrl : '',
                config: props.config ? props.config : null
            };
        },
        getTransmissionServices: function() {
            return this.transmissionServicesMap;
        }
    };

    return service;
}
