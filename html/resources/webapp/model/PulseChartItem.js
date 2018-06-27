sap.ui.define([
        "sap/ui/base/ManagedObject",
        "sap/fiori/cri/datatype/DateString",
        "sap/ui/core/format/DateFormat"
    ],
    /**
     * Pulse Chart Item
     * @param {sap.ui.base.ManagedObject} Element - Element
     * @param {sap.fiori.cri.datatype.DateString} DateString - DateString
     * @param {sap.ui.core.format.DateFormat} DateFormat - DateFormat
     * @returns {sap.fiori.cri.model.PulseChartItem} Pulse Chart Item
     */
    function (ManagedObject, DateString, DateFormat) {
        "use strict";
        return ManagedObject.extend("sap.fiori.cri.model.PulseChartItem", {
            /**
             * Metadata for the chart item
             */
            metadata: {
                properties: {
                    dateString: {type: "sap.fiori.cri.datatype.DateString"},
                    endDateString: {type: "sap.fiori.cri.datatype.DateString"},
                    dateFormat: {type: "string"},
                    label: {type: "string"},
                    value: {type: "float"},
                    data: {type: "Object"}
                }
            },

            /**
             * Gets the date for the chart item
             * @returns {Date} Date for the chart item
             */
            getDate: function () {

                var dateString = this.getDateString();
                var formatString = this.getDateFormat();

                if (formatString != null) {

                    if (this.oDateFormat == null) {
                        this.oDateFormat = DateFormat.getInstance({
                            source: {pattern: formatString},
                            pattern: "MMM yy"
                        });
                    }

                    return this.oDateFormat.parse(dateString);
                }

                return new Date(dateString);
            },

            /**
             * Gets the end date for the chart item (if exists)
             * @returns {Date} Date for the chart item
             */
            getEndDate: function () {

                var dateString = this.getEndDateString();
                var formatString = this.getDateFormat();

                if (formatString != null && dateString != null) {

                    if (this.oDateFormat == null) {
                        this.oDateFormat = DateFormat.getInstance({
                            source: {pattern: formatString},
                            pattern: "MMM yy"
                        });
                    }

                    return this.oDateFormat.parse(dateString);
                }

                return dateString != null ? new Date(dateString) : null;
            }
        });
    });