jQuery.sap.require("sap.m.MessageBox");
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/fiori/cri/model/formatter"
],
    /**
     * ExportToEmail Dialog Controller
     * @param {sap.ui.core.mvc.Controller} Controller Controller
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.fiori.cri.model.formatter} Formatter Formatter
     * @return {*} ExportToEmail Dialog Control
     */
    function (Controller, JSONModel, Formatter) {
    "use strict";
    return Controller.extend("sap.fiori.cri.controller.ExportToEmailDialog", {
        formatter: Formatter,
        _getDialog : function () {
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("sap.fiori.cri.view.ExportToEmailDialog", this);
                var model = new JSONModel();
                this._oDialog.setModel(model);
            }
            return this._oDialog;
        },
        open : function (oView, customerList) {
            var oDialog = this._getDialog();
            if (oView.indexOfDependent(oDialog) == -1) {
                oView.addDependent(oDialog);
            }
            oDialog.open();

            if (customerList) {
                this._oDialog.getModel().setProperty("/Customers", customerList);
            }
        },
        onCloseDialog : function () {
            this._getDialog().close();
        }
    });
});