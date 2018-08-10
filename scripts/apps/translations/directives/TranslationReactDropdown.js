/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * @ngdoc directive
 * @module superdesk.apps.translations
 * @name TranslationReactDropdown
 *
 * @requires React
 * @requires item
 * @requires className
 * @requires TranslationService
 * @requires noLanguagesLabel
 *
 * @param {Object} [langugages] collection of languages
 *
 * @description Creates dropdown react element with list of available languages
 */
TranslationReactDropdown.$inject = ['item', 'className', 'TranslationService', 'noLanguagesLabel'];
export function TranslationReactDropdown(item, className, TranslationService, noLanguagesLabel) {
    var languages = TranslationService.get() || {_items: []};

    /*
     * Creates specific language button in list
     * @return {React} Language button
     */
    class TranslateBtn extends React.Component {
    props: any;
    state: any;
 
    static propTypes: any;
    static defaultProps: any

        constructor(props) {
            super(props);
            this.markTranslate = this.markTranslate.bind(this);
        }

        markTranslate(event) {
            event.stopPropagation();
            TranslationService.set(this.props.item, this.props.language);
        }

        render() {
            var item = this.props.item;
            var language = this.props.language;
            var isCurrentLang = item.language === language.language;

            if (!language.destination) {
                return false;
            }

            return React.createElement(
                'button', {
                    disabled: isCurrentLang,
                    onClick: this.markTranslate,
                },
                language.label
            );
        }
    }

    TranslateBtn.propTypes = {
        item: PropTypes.object,
        language: PropTypes.object,
    };

    /*
     * Creates list element for specific language
     * @return {React} Single list element
     */
    var createTranslateItem = function(language) {
        return React.createElement(
            'li',
            {key: 'language-' + language._id},
            React.createElement(TranslateBtn, {item: item, language: language})
        );
    };

    /*
     * If there are no languages, print none-langugage message
     * @return {React} List element
     */
    var noLanguage = function() {
        return React.createElement(
            'li',
            {},
            React.createElement(
                'button',
                {disabled: true},
                noLanguagesLabel)
        );
    };

    /*
     * Creates list with languages
     * @return {React} List element
     */
    return React.createElement(
        'ul',
        {className: className},
        languages._items.length ? languages._items.map(createTranslateItem) : React.createElement(noLanguage)
    );
}
