import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {getSelectSingleValue} from './select_single_value';
import {IMacro} from 'superdesk-interfaces/Macro';
import {IRestApiResponse} from 'superdesk-api';

export const MacroSingleValue = getSelectSingleValue(
    (props) =>
        ng.getService('api')
            .then((api) => {
                const deskId = props.formValues[props.formField.component_parameters['deskField']];

                if (deskId == null) {
                    return Promise.resolve(null);
                } else {
                    return api('macros').query({
                        where: {desk: deskId},
                        max_results: 200,
                    })
                        .then(
                            (stages: IRestApiResponse<IMacro>) =>
                                stages._items.map(({label}) => ({id: label, label: label})),
                        );
                }
            }),
    gettext('Select a desk first'),
    (props) => [props.formField.component_parameters['deskField']],
);
