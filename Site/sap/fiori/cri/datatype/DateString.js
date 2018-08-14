sap.ui.define([
        "sap/ui/model/type/String",
        "sap/ui/model/ValidateException"
    ],
    /**
     * DateString extension of string data type
     * @param {sap.ui.model.type.String} String - String
     * @param {sap.ui.model.ValidateException} ValidateException - ValidateException
     * @returns {sap.fiori.cri.datatype.DateString} DateString data type
     */
    function (String, ValidateException) {
        "use strict";
        return String.extend("sap.fiori.cri.datatype.DateString", {
                /**
                 * Formats the value
                 * @param {string} oValue - Value to be formatted
                 * @returns {string} Formatted value
                 */
                formatValue: function (oValue) {
                    return oValue;
                },

                /**
                 * Parses the value
                 * @param {string} oValue - Value to be parsed
                 * @returns {string} Parsed value
                 */
                parseValue: function (oValue) {
                    return oValue;
                },

                /**
                 * Validates the value
                 * @param {string} oValue - Value to be validated
                 * @throws {ValidateException} ValidateException - ValidateException thrown when the date string cannot be validated
                 */
                validateValue: function (oValue) {
                    if (new Date(oValue) == null) {
                        throw new ValidateException("DateString must be convertible to date");
                    }
                }
            }
        );
    }
);