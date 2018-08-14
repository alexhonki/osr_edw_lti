sap.ui.define([
    "sap/ui/model/odata/ODataModel"
], function (ODataModel) {
    "use strict";
    return {
        /**
         *
         * @param data
         * @returns {{CustomerId: *, OriginId: *, CustomerName: *, OperatingIncome: *, Churned: string, Currency: *}}
         */
        mapToCustomer: function (data) {
            return {
                CustomerId: data['CUST_ID'],
                OriginId: data['EXT_ID'],
                CustomerName: data['NAME'],
                OperatingIncome: data['INCOME_LOSS'],
                Churned: data['CHURNED_FLAG'] ? 'Yes' : 'No',
                Currency: data['CURRENCY']
            };
        }
    };
});