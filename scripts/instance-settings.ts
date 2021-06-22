/* eslint-disable quotes, comma-dangle */
/* tslint:disable: trailing-comma */

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
                "customToolbar": gettext('customToolbar'),
                "editor": gettext('editor')
            }
        },
        "monitoring": {
            "properties": {
                "stageCount": {
                    "items": {
                        "type": "string"
                    },
                    "type": "array"
                }
            },
            "required": [
                "stageCount"
            ],
            "type": "object",
            "translations": {
                "stageCount": gettext('stageCount')
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
