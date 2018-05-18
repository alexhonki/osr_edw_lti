sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/fiori/cri/model/formatter"
],
    /**
     * ModifyEvents Dialog Controller
     * @param {sap.ui.core.mvc.Controller} Controller Controller
     * @param {sap.ui.modle.json.JSONModel} JSONModel JSONModel
     * @param {sap.fiori.cri.model.formatter} Formatter Formatter
     * @returns {*} ModifyEvents Dialog Control
     */
    function (Controller, JSONModel, Formatter) {
    "use strict";
    return Controller.extend("sap.fiori.cri.controller.ModifyEventsDialog", {
        formatter: Formatter,
        _getDialog : function () {
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("sap.fiori.cri.view.ModifyEventsDialog", this);
                var model = new JSONModel();

                this._oDialog.setModel(model);
            }
            return this._oDialog;
        },
        open : function (oView, aEventList, sActionName, fnOnSubmitAction) {
            var oDialog = this._getDialog();
            if (oView.indexOfDependent(oDialog) == -1) {
                oView.addDependent(oDialog);
            }
            oDialog.open();

            if (aEventList) {
                this._oDialog.getModel().setProperty("/Events", aEventList);
                this._oDialog.getModel().setProperty("/ActionName", sActionName);
            }

            this.aEventsList = aEventList;
            this.fnOnSubmitAction = fnOnSubmitAction;
        },
        formatStatusLabel: function (sStatus) {
            if (sStatus == 0) {
                return "Deactivated";
            } else if (sStatus == 1) {
                return "Activated";
            } else {
                return sStatus;
            }
        },
        formatStatusState:function (sStatus) {
            if (sStatus == 0) {
                return "Error";
            } else if (sStatus == 1) {
                return "Success";
            } else {
                return "None";
            }
        },
        formatStatusIcon: function (sStatus) {
            if (sStatus == 0) {
                return "sap-icon://hide";
            } else if (sStatus == 1) {
                return "sap-icon://show";
            } else {
                return "";
            }
        },
        onSubmitAction: function () {
            if (this.fnOnSubmitAction) {
                this.fnOnSubmitAction(this.aEventsList);
            }
            this._getDialog().close();
        },
        onCloseDialog : function () {
            this._getDialog().close();
        }
    });
});