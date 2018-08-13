import React from 'react';
import ReactDOM from 'react-dom';
import ItemsTableComponent from '../components/ItemsTableComponent';
import {forEach, every} from 'lodash';


export const VocabularyConfigModalItems:any = (gettext) => ({
    require: '^^form',
    link: (scope, element, attr, ngForm) => {
        let component;
        let itemsValidation = [];

        function validateItem(item) {
            let itemValidation = {};

            forEach(scope.vocabulary.schema, (desc, field) => {
                itemValidation[field] = !desc.required || !!item[field];
            });
            return itemValidation;
        }

        function validItem(itemValidation) {
            return every(scope.vocabulary.schema, (schema, schemaId) =>
                !schema.required || itemValidation[schemaId]);
        }

        const validateItems = (items) => {
            scope.itemsValidation.valid = true;
            itemsValidation = items.map((_item) => {
                let itemValidation = validateItem(_item);

                scope.itemsValidation.valid = scope.itemsValidation.valid && validItem(itemValidation);
                return itemValidation;
            });
        };

        const update = (item, key, value) => {
            const updates = {[key]: value};

            // sync scope
            scope.$applyAsync(() => {
                ngForm.$setDirty();
                let index = 0;

                scope.vocabulary.items = scope.vocabulary.items.map((_item) => {
                    index++;
                    if (_item === item) {
                        let updated = Object.assign({}, item, updates);

                        itemsValidation[index - 1] = validateItem(updated);
                        scope.itemsValidation.valid = scope.itemsValidation.valid &&
                                validItem(itemsValidation[index - 1]);
                        return updated;
                    }
                    return _item;
                });
            });
        };

        const remove = (index) => {
            scope.$applyAsync(() => {
                ngForm.$setDirty();
                scope.removeItem(index);
            });
        };

        // render component
        ReactDOM.render(<ItemsTableComponent
            ref={(ref) => component = ref}
            model={scope.model}
            schema={scope.schema}
            schemaFields={scope.schemaFields}
            gettext={gettext}
            remove={remove}
            update={update}
        />, element[0]);

        // destroy component with directive
        scope.$on('$destroy', () => {
            ReactDOM.unmountComponentAtNode(element[0]);
            component = null;
        });

        // re-render on items changes
        scope.$watchCollection('vocabulary.items', (items) => {
            if (items && component) {
                validateItems(items);
                component.setState({items, itemsValidation});
            }
        });
    },
});

VocabularyConfigModalItems.$inject = ['gettext'];