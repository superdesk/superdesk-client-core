import React from 'react';

Translations.$inject = ['item', 'className', 'TranslationService', 'noLanguagesLabel'];
export function Translations(item, className, TranslationService, noLanguagesLabel) {
     var languages = TranslationService.languages || {_items: []};

    var TranslateBtn = React.createClass({
        markTranslate: function(event) {
            event.stopPropagation();
            TranslationService.set(this.props.item, this.props.language);
        },
        render: function() {
            var item = this.props.item;
            var language = this.props.language;
            var isCurrentLang = item.language === language.language;

            if (!language.source) {
                return false;
            }

            return React.createElement(
                'button', {
                    disabled: isCurrentLang,
                    onClick: this.markTranslate
                },
                language.label
            );
        }
    });

    var createTranslateItem = function(language) {
        return React.createElement(
            'li',
            {key: 'language-' + language._id},
            React.createElement(TranslateBtn, {item: item, language: language})
        );
    };

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

    return React.createElement(
        'ul',
        {className: className},
        languages._items.length ? languages._items.map(createTranslateItem) : React.createElement(noLanguage)
    );
}
