/* eslint-disable quotes, comma-dangle */
/* tslint:disable: trailing-comma max-line-length */

export const getInstanceConfigSchema = (gettext) => ({
    "$schema": "http://json-schema.org/draft-07/schema#",
    "properties": {
        "authoring": {
            "properties": {
                "customToolbar": {
                    "type": "boolean"
                },
                "editor": {
                    "properties": {
                        "version": {
                            "description": gettext('Version 2 is deprecated.'),
                            "enum": [
                                "2",
                                "3"
                            ],
                            "type": "string"
                        }
                    },
                    "required": [
                        "version"
                    ],
                    "type": "object",
                    "translations": {
                        "version": gettext('version')
                    }
                }
            },
            "required": [
                "customToolbar",
                "editor"
            ],
            "type": "object",
            "translations": {
                "customToolbar": gettext('custom toolbar'),
                "editor": gettext('editor')
            }
        },
        "monitoring": {
            "properties": {
                "listOfBooleans": {
                    "items": {
                        "type": "boolean"
                    },
                    "type": "array"
                },
                "listOfNumbers": {
                    "items": {
                        "type": "number"
                    },
                    "type": "array"
                },
                "listOfStrings": {
                    "items": {
                        "type": "string"
                    },
                    "type": "array"
                },
                "listOfUnions": {
                    "items": {
                        "enum": [
                            "item 1",
                            "item 2",
                            "item 3"
                        ],
                        "type": "string"
                    },
                    "type": "array"
                }
            },
            "required": [
                "listOfBooleans",
                "listOfNumbers",
                "listOfStrings",
                "listOfUnions"
            ],
            "type": "object",
            "translations": {
                "listOfBooleans": gettext('list of booleans'),
                "listOfNumbers": gettext('list of numbers'),
                "listOfStrings": gettext('list of strings'),
                "listOfUnions": gettext('list of unions')
            }
        }
    },
    "required": [
        "authoring",
        "monitoring"
    ],
    "type": "object",
    "translations": {
        "authoring": gettext('authoring'),
        "monitoring": gettext('monitoring')
    }
});
