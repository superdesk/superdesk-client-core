import React from 'react';
import ReactDOM from 'react-dom';
import ItemsTableComponent from '../components/ItemsTableComponent';

VocabularyConfigModalItems.$inject = ['gettext'];
export function VocabularyConfigModalItems(gettext) {
    return {
        require: '^^form',
        link: (scope, element, attr, ngForm) => {
            let component;

            const update = (item, key, value) => {
                const updates = {[key]: value};

                // sync scope
                scope.$applyAsync(() => {
                    ngForm.$setDirty();
                    scope.vocabulary.items = scope.vocabulary.items.map((_item) =>
                        _item === item ? Object.assign({}, item, updates) : _item
                    );
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
            scope.$watch('vocabulary.items', (items) => {
                if (items && component) {
                    component.setState({items});
                }
            });
        }
    };
}