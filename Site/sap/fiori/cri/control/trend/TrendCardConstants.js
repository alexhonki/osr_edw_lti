(function () {
    "use strict";

    jQuery.sap.declare("sap.fiori.cri.control.trend.TrendCardConstants");

    sap.fiori.cri.control.trend.TrendCardConstants = {
        STYLE: {
            kpiValueNegative: "negative",
            kpiValuePositive: "positive",
            kpiValueNeutral: "neutral"
        },
        COLOR: {
            semantic: {
                negative: "#BB0000",
                critical: "#E78C07",
                positive: "#2B7D2B",
                neutral: "#5E696E",
                negativeLight: '#F77E80'
            },
            qualitative: {
                blue: '#49AAE2',
                gold: '#EFCC2C'
            },
            donut: {
                primary: ["#BB0000", "#E78C07", "#49AAE2"],
                secondary: ["#DA2170", "#FFC21F", "#1959AF"]
            }

        },
        FORMAT_NAME: {
            CRIShort:"__CRI_SHORT__"
        },
        TREND_DIRECTION: {
            minimize: "Minimize",
            maximize: "Maximize"
        },
        formatValue: function (value, maxDigits, sNoDataValue) {
            var iMaxDigits = 1;

            if (Math.abs(value) < 1) {
            	if( typeof Math.log10 === "undefined" ){
                   // Calculate number of decimal places required to show values less than 1
                	iMaxDigits = Math.ceil(Math.abs(Math.log(Math.abs(value))/Math.log(10)));
                } else{
                 // Calculate number of decimal places required to show values less than 1
                	iMaxDigits = Math.ceil(Math.abs(Math.log10(Math.abs(value))));	
                }

                // Show at most 3 decimal places
                iMaxDigits = Math.min(iMaxDigits, 3);
            }

            var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                minFractionDigits: 0,
                maxFractionDigits: maxDigits || iMaxDigits,
                style:"short"
            });

            if (value || value == 0) {
                return oNumberFormat.format(value);
            } else {
                // Handle null or undefined values
                return sNoDataValue || "N/A";
            }
        }
    };
})();