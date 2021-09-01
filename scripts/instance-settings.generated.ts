/* eslint-disable quotes, comma-dangle */
/* tslint:disable: trailing-comma max-line-length */

export const getInstanceConfigSchema = (gettext) => ({
    "$schema": "http://json-schema.org/draft-07/schema#",
    "properties": {
        "locale": {
            "properties": {
                "firstDayOfWeek": {
                    "enum": [
                        "monday",
                        "saturday",
                        "sunday"
                    ],
                    "type": "string"
                }
            },
            "required": [
                "firstDayOfWeek"
            ],
            "type": "object",
            "translations": {
                "firstDayOfWeek": gettext('first day of week')
            }
        },
        "users": {
            "properties": {
                "minutesOnline": {
                    "description": gettext('Time of inactivity in minutes until user is no longer considered online.'),
                    "type": "number"
                }
            },
            "required": [
                "minutesOnline"
            ],
            "type": "object",
            "translations": {
                "minutesOnline": gettext('minutes online')
            }
        }
    },
    "required": [
        "locale",
        "users"
    ],
    "type": "object",
    "translations": {
        "locale": gettext('locale'),
        "users": gettext('users')
    }
});
