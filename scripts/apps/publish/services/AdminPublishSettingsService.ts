import {transmissionTypes} from '../constants';
import {appConfig} from 'appConfig';

AdminPublishSettingsService.$inject = ['api'];
export function AdminPublishSettingsService(api) {
    var _fetch = function(endpoint, criteria) {
        return api[endpoint].query(criteria);
    };

    var service = {
        transmissionServicesMap: {},
        fetchPublishErrors: function() {
            var criteria = {io_type: 'publish'};

            return _fetch('io_errors', criteria);
        },
        registerTransmissionService: function(name, props) {
            const templateUrl = transmissionTypes[name] != null ? transmissionTypes[name].templateUrl : '';

            this.transmissionServicesMap[name] = {
                delivery_type: name,
                label: props.label ? props.label : name,
                templateUrl: templateUrl,
                config: props.config ? props.config : null,
            };
        },
        getTransmissionServices: function() {
            return this.transmissionServicesMap;
        },
    };

    const _types = appConfig.transmitter_types || [];

    _types.forEach((data) => {
        service.registerTransmissionService(data.type, {
            label: data.name,
            config: data.config,
        });
    });

    return service;
}
