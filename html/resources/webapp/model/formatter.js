sap.ui.define(["sap/ui/core/format/DateFormat", "sap/ui/core/format/NumberFormat"], function (DateFormat, NumberFormat) {
    "use strict";
    return {
        _dateFormatters: {},
        statusColor: function (sStatus) {
            switch (sStatus) {
                case "At Risk":
                    return sap.ui.core.IconColor.Critical;
                case "Processing":
                    return sap.ui.core.IconColor.Neutral;
                case "Ok":
                    return sap.ui.core.IconColor.Positive;
                default:
                    return sap.ui.core.IconColor.Default;
            }
        },
        statusIcon: function (sStatus) {
            switch (sStatus) {
                case "At Risk":
                    return "sap-icon://status-critical";
                case "Processing":
                    return "sap-icon://status-in-process";
                case "Ok":
                    return "sap-icon://status-completed";
                default:
                    return "sap-icon://status-inactive";
            }
        },
        percentage: function (fPercentage, iMaxDigits, iMinDigits) {
            if (!fPercentage) {
                return fPercentage;
            }

            var percentFormatter = NumberFormat.getPercentInstance({
                style: 'short',
                minFractionDigits: iMinDigits != null ? iMinDigits : 0,
                maxFractionDigits: iMaxDigits != null ? iMaxDigits : 2
            });
            return percentFormatter.format(fPercentage);

            //return (fPercentage * 100).toFixed(2) + "%";
        },
        pulse: function (fValue) {
            return fValue * 100;
        },
        dateWithDayMonthYear: function (oDate) {
            return DateFormat.getDateInstance({pattern: "dd MMM yyyy"}).format(oDate);
        },
        number: function (value, maxDigits, minDigits) {
            var formatNumber = sap.ui.core.format.NumberFormat.getFloatInstance({
                style: 'short',
                showMeasure: false,
                minFractionDigits: minDigits != null ? minDigits : 0,
                maxFractionDigits: maxDigits != null ? maxDigits : 2
            });
            return formatNumber.format(Number(value));
        },
        dateFromString: function (sDate, sFormat) {
            return this.getDateFormatter(sFormat).parse(sDate);
        },

        stringFromDate: function (oDate, sFormat) {
            return this.getDateFormatter(sFormat).format(oDate);
        },

        getDateFormatter: function (sFormat) {
            if (!this._dateFormatters[sFormat]) {
                this._dateFormatters[sFormat] = DateFormat.getDateTimeInstance({pattern: sFormat});
            }

            return this._dateFormatters[sFormat];
        }
    };
});