jQuery.sap.require("jquery.sap.storage");
sap.ui.define([
    "sap/fiori/cri/model/formatter"
], function (formatter) {
    "use strict";
    return {
        FILTER_TYPE: {
            date:"date",
            dropDown:"dropDown",
            search:"search",
            multiComboBox: "multiComboBox"
        },
        _defaultConfig: {
            format: {
                dateValue: "yyyyMM",
                dateDisplay: "MMM yyyy"
            },
            filters: {
                toDate:"201612",
                monthsToShow: 6
            },
            filterKeys: {
                fromDate:"IP_FROM",
                toDate:"IP_TO",
                eventSearchQuery: "EVENT_NAME",
                customerSearchQuery: "CUSTOMER_NAME"
            },
            filterLabels: {
                fromDate:"From",
                toDate:"To",
                searchQuery: "Search",
                customerSearchQuery: "Search",
                eventSearchQuery: "Search"
            }
        },
        _filterStorageKey: "criFilterModel",

        getFilterConfig: function () {
            if (!this._currentConfig) {
                this._currentConfig = this._defaultConfig;
            }
            return this._currentConfig;
        },

        getDefaultFilters: function (sName) {
            if (sName) { return {}; }

            if (!this._defaultFilters) {
                this._defaultFilters = this.buildDefaultFilters();
            }
            return this._defaultFilters;
        },

        buildDefaultFilters: function () {
            var config = this.getFilterConfig();
            var filters = config.filters;

            var sFormat = config.format.dateValue;
            var mFilterKeys = config.filterKeys;

            var sFromDate = filters.fromDate;
            var sToDate = filters.toDate;

            if (!sFromDate) {
                var iMonthsToShow = filters.monthsToShow;
                if (!iMonthsToShow && iMonthsToShow != 0) {
                    return null; // Can't calculate from date without months to show
                }

                var oToDate = sToDate ? formatter.dateFromString(sToDate, sFormat) : new Date();
                var aDateRange = this.buildDateRange(oToDate, iMonthsToShow);

                if (aDateRange.length != 2) {
                    return null; // Can't return a date range without from and to values
                }

                sFromDate = formatter.stringFromDate(aDateRange[0], sFormat);
            }

            var oFilters = {};
            oFilters[mFilterKeys.fromDate] = sFromDate;
            oFilters[mFilterKeys.toDate] = sToDate;

            return oFilters;
        },

        buildDateRange: function (oToDate, iMonthsToShow) {
            var oFromDate = oToDate;
            oFromDate.setMonth(oToDate.getMonth() - iMonthsToShow + 1);
            return [oFromDate, oToDate];
        },

        getStorage:function () {
          return jQuery.sap.storage(jQuery.sap.storage.Type.session);
        },

        setFilterData: function (oFilters, sName) {
            this.getStorage().put(sName || this._filterStorageKey, oFilters);
        },

        getFilterData: function (sName) {
            var filterData = this.getStorage().get(sName || this._filterStorageKey);

            if (!filterData) {
                filterData = this.getDefaultFilters(sName);
                this.setFilterData(filterData, sName);
            }

            return filterData;
        },

        getFilterString: function (sName) {
            var filterKeys = this.getFilterConfig().filterKeys;

            var sFilterString = "";
            var oFilters = this.getFilterData(sName);

            for (var sKey in oFilters) {
                if (sKey != filterKeys.fromDate && sKey != filterKeys.toDate && oFilters[sKey] && sKey != filterKeys.eventSearchQuery && sKey != filterKeys.customerSearchQuery) {
                    sFilterString +=  sKey + ":" + oFilters[sKey] + ",";
                }
            }

            sFilterString = sFilterString.slice(0, -1);

            return sFilterString;
        },

        getDateFilterString: function () {
            var filterKeys = this.getFilterConfig().filterKeys;
            var sFromDate = this.getFilterValue(filterKeys.fromDate);
            var sToDate = this.getFilterValue(filterKeys.toDate);

            return filterKeys.fromDate + "=" + sFromDate + "," + filterKeys.toDate + "=" + sToDate;
        },

        getEncodedFilterString: function (sName) {
          return encodeURIComponent(this.getFilterString(sName));
        },

        resetFilterData: function (sName) {
            this.setFilterData(this.getDefaultFilters(sName), sName);
        },

        clearFilterData: function (sName) {
            this.getStorage().remove(sName || this._filterStorageKey);
        },

        getFilterValue: function (key, sName) {
            var oFilters = this.getFilterData(sName);
            return oFilters[key];
        },

        setFilterValue: function (key, value, sName) {
            var oFilters = this.getFilterData(sName);
            oFilters[key] = value;
            this.setFilterData(oFilters, sName);
        },

        getDefaultFilterValue: function (sKey, sName) {
          return this.getDefaultFilters(sName)[sKey];
        },

        buildControlConfigurationsForDateRangeFilters: function (fnFilterChange) {

            var config = this.getFilterConfig();

            var sFromDateKey = config.filterKeys.fromDate;
            var sToDateKey = config.filterKeys.toDate;
            var sFromDateLabel = config.filterLabels.fromDate;
            var sToDateLabel = config.filterLabels.toDate;

            var oFromDateControl = this.buildDateControl(this.getFilterValue(sFromDateKey));
            var oToDateControl = this.buildDateControl(this.getFilterValue(sToDateKey));

            oFromDateControl.attachChange(function (oEvent) {
                var sFilterValue = oEvent.getParameter("value");
                if (sFilterValue) {

                    // Check other date control to make sure the range is valid
                    this.setFilterValue(sFromDateKey, sFilterValue);
                    if (fnFilterChange) { fnFilterChange(sFromDateKey, sFilterValue); }
                }
            }.bind(this));

            oToDateControl.attachChange(function (oEvent) {
                var sFilterValue = oEvent.getParameter("value");
                if (sFilterValue) {

                    // Check other date control to make sure the range is valid
                    this.setFilterValue(sToDateKey, sFilterValue);
                    if (fnFilterChange) { fnFilterChange(sToDateKey, sFilterValue); }
                }
            }.bind(this));

            return [
                {
                    key: sFromDateKey,
                    label: sFromDateLabel,
                    customControl: oFromDateControl,
                    index: 0
                },
                {
                    key: sToDateKey,
                    label: sToDateLabel,
                    customControl: oToDateControl,
                    index: 1
                }
            ];
        },

        isValidDateString: function (sValue, sFormat) {
            var format = this.getFilterConfig().format;
            var oDate = formatter.dateFromString(sValue, sFormat || format.dateValue);
            return oDate != null;
        },

        isValidDateRange: function (sFromDate, sToDate, sFormat) {
            var format = this.getFilterConfig().format;
            var oFromDate = formatter.dateFromString(sFromDate, sFormat || format.dateValue);
            var oToDate = formatter.dateFromString(sToDate, sFormat || format.dateValue);
            return oFromDate <= oToDate;
        },

        buildDateControl: function (oInitialValue, sValueFormat, sDisplayFormat) {
            var format = this.getFilterConfig().format;
            return new sap.m.DatePicker({
                value: oInitialValue,
                valueFormat: sValueFormat || format.dateValue,
                displayFormat: sDisplayFormat || format.dateDisplay
            });
        },

        labelForKey: function (sKey, oLabelModel) {
            var oLabels = oLabelModel && oLabelModel.getData();
            var sFilterLabelKey = "Filter" + sKey;
            var oConfig = this.getFilterConfig();
            return (oLabels && oLabels.hasOwnProperty(sFilterLabelKey) && oLabelModel.getData()[sFilterLabelKey])
                || (oConfig.filterLabels.hasOwnProperty(sKey) && oConfig.filterLabels[sKey])
                || null;
        },

        getSelectedFilterLabels: function (oLabelModel) {
            return $.map(this.getFilterData(), function (value, key) {
                return value ? (this.labelForKey(key, oLabelModel) || key) : null;
            }.bind(this));
        }
    };
});