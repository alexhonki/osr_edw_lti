sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/fiori/cri/model/formatter"
],
    /**
     * ModifyCustomersDialog Controller
     * @param {sap.ui.core.mvc.Controller} Controller Controller
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.fiori.cri.model.formatter} Formatter Formatter
     * @returns {*} ModifyCustomersDialog Control
     */
    function (Controller, JSONModel, Formatter) {
    "use strict";
    return Controller.extend("sap.fiori.cri.controller.ModifyCustomersDialog", {
        formatter: Formatter,
        _getDialog : function () {
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("sap.fiori.cri.view.ModifyCustomersDialog", this);
                var model = new JSONModel();

                this._oDialog.setModel(model);
            }
            return this._oDialog;
        },
        open : function (oView, aCustomerList, sActionName, fnOnSubmitAction) {
            var oDialog = this._getDialog();
            oView.addDependent(oDialog);
            oDialog.open();

            if (aCustomerList) {
                this._oDialog.getModel().setProperty("/Customers", aCustomerList);
                this._oDialog.getModel().setProperty("/ActionName", sActionName);
            }

            this.aCustomerList = aCustomerList;
            this.fnOnSubmitAction = fnOnSubmitAction;
        },
        formatStatusLabel:function (sStatus) {
            if (sStatus == 0) {
                return "Unblocked";
            } else if (sStatus == 1) {
                return "Blocked";
            } else if (sStatus == 2) {
                return "To Be Deleted";
            } else if (sStatus == 3){
                return "Deleted";
            } else {
                return "";
            }
        },
        onSubmitAction: function () {
            if (this.fnOnSubmitAction) {
                this.fnOnSubmitAction(this.aCustomerList);
            }
            this._getDialog().close();
        },
        onCloseDialog : function () {
            this._getDialog().close();
        }
    });
});