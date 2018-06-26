sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/ODataModel",
    "sap/fiori/cri/controller/ExportToHybrisDialog",
    "sap/fiori/cri/controller/ExportToEmailDialog",
    "sap/fiori/cri/service/Utilities"
],
    /**
     * Export Dialog Controller
     * @param {sap.ui.core.mvc.Controller} Controller Controller
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.ui.model.odata.ODataModel} ODataModel ODataModel
     * @param {sap.fiori.cri.controller.ExportToHybrisDialog} HybrisDialog Hybris Dialog
     * @param {sap.fiori.cri.controller.ExportToEmailDialog} EmailDialog Email Dialog
     * @param {sap.fiori.cri.service.Utilities} Utilities Utilities
     * @returns {*} Export Dialog Control
     */
    function (Controller, JSONModel, ODataModel, HybrisDialog, EmailDialog, Utilities) {
    "use strict";
    return Controller.extend("sap.fiori.cri.controller.ExportDialog", {
        _getDialog : function () {
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("sap.fiori.cri.view.ExportDialog", this);
                var model = new JSONModel();

                //TODO: Work out how to pass to hybris dialog
                //var hybrisTargetGroupModel = new ODataModel("/hybris/API_MKT_TARGET_GROUP_SRV", {
                //    loadMetadataAsync: true
               // });

                /*hybrisTargetGroupModel.attachMetadataLoaded(null, function () {
                    model.setProperty("/HybrisEnabled", true);
                });*/

                this._oDialog.setModel(model);
                model.setProperty("/HybrisEnabled", false);
            }
            return this._oDialog;
        },
        open : function (oView, customerList, bSourceEvent) {
            var oDialog = this._getDialog();
            if (oView.indexOfDependent(oDialog) == -1) {
                oView.addDependent(oDialog);
            }
            this._view = oView;
            oDialog.getModel().setProperty("/customerList", customerList);
            oDialog.getModel().setProperty("/sourceEvent", bSourceEvent);
            oDialog.open();
        },
        exportEMail: function () {
            if (!this._emailDialog) {
                this._emailDialog = new EmailDialog();
            }
            this._emailDialog.open(this._view, this._getDialog().getModel().getProperty("/customerList"));
            this._getDialog().close();
        },
        exportCSV: function () {
            var bSourceEvent = this._getDialog().getModel().getProperty("/sourceEvent");
			var i18nModel = this._view.getModel("i18n").getResourceBundle();
            var arrayOfData = [];
            if(bSourceEvent){
            	arrayOfData = [
                [i18nModel.getText("EventOverview.CustomerListColumnId"), 
                i18nModel.getText("EventOverview.CustomerListColumnName"),
                i18nModel.getText("EventOverview.CustomerListColumnOperatingIncomeLoss"),
                i18nModel.getText("EventOverview.CustomerListColumnEventYr"),
                i18nModel.getText("EventOverview.CustomerListColumnReacted"),
                i18nModel.getText("EventOverview.CustomerListColumnReactedDate")]
            ];
            } else{
            	arrayOfData = [
                [i18nModel.getText("CustomersAtRisk.CustomerListColumnId"), 
                i18nModel.getText("CustomersAtRisk.CustomerListColumnName"),
                i18nModel.getText("CustomersAtRisk.CustomerListColumnOperatingIncomeLoss"),
                i18nModel.getText("CustomersAtRisk.AllCustomersTableColumnRisk")]
            ];
            }
           
            var customers = this._getDialog().getModel().getProperty("/customerList");
            customers.forEach(function (entry) {
                if(bSourceEvent){
                	arrayOfData.push([
                    entry.OriginId,
                    entry.CustomerName,
                    entry.OperatingIncome,
                    entry.EVENT_YEAR,
                    entry.Churned,
                    entry.INIT_DATE        
                	]);
                } else {
                	arrayOfData.push([
                    entry.OriginId,
                    entry.CustomerName,
                    entry.OperatingIncome,
                    entry.Risk        
                ]);
                }
                
            });
            Utilities.saveCSV(arrayOfData, "Customer List");
        },
        exportHybris: function () {
            if (!this._hybrisDialog) {
                this._hybrisDialog = new HybrisDialog();
            }
            this._hybrisDialog.open(this._view, this._getDialog().getModel().getProperty("/customerList"));
            this._getDialog().close();
        },
        onCloseDialog : function () {
            this._getDialog().close();
        }
    });
});