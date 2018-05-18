jQuery.sap.require("sap.m.MessageBox");
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/ODataModel",
    "sap/fiori/cri/model/formatter",
    "sap/fiori/cri/service/ErrorService",
    "sap/m/MessageBox"
],
    /**
     * ExportToHybris Dialog Controller
     * @param {sap.ui.core.mvc.Controller} Controller Controller
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.ui.model.odata.ODataModel} ODataModel ODataModel
     * @param {sap.fiori.cri.model.formatter} Formatter Formatter
     * @param {sap.fiori.cri.service.ErrorService} ErrorService Error Service
     * @param {sap.m.MessageBox} MessageBox MessageBox
     * @returns {*} ExportToHybris Dialog Control
     */
    function (Controller, JSONModel, ODataModel, Formatter, ErrorService, MessageBox) {
    "use strict";
    return Controller.extend("sap.fiori.cri.controller.ExportToHybrisDialog", {
        formatter: Formatter,
        _getDialog : function () {
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("sap.fiori.cri.view.ExportToHybrisDialog", this);
                var model = new JSONModel();
                this._oDialog.setModel(model);
            }
            return this._oDialog;
        },
        loadSetting: function (key, type, onDone) {
            var criModel = this._oDialog.getModel("CRI");
            criModel.read("/SystemSettings('" + key + "')",
                {
                    eTag: "*" ,
                    success: function (oData) {
                        try {
                            var value = oData[type];
                            onDone(true, value);
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                            onDone(false);
                        }
                    },
                    error: function (oError) {
                        //404 (should mean) setting not set, use default
                        if (oError.statusCode === "404") {
                            onDone(true, null);
                        } else {
                            ErrorService.raiseGenericError(oError);
                            onDone(false);
                        }
                    }
                }
            );
        },
        open : function (oView, customerList) {
            var oDialog = this._getDialog();
            if (oView.indexOfDependent(oDialog) == -1) {
                oView.addDependent(oDialog);
            }
            oDialog.open();
            oDialog.setBusy(true);

            var hybrisSettings = {
                MarketingAreaId: "CXXGLOBAL",
                TargetGroupOrigin: "SAP_HYBRIS_CONSUMER",
                ClientId: null
            };

            var that = this;

            var settingsLoading = 2;
            var onSettingsLoaded = function (success) {
                if (--settingsLoading == 0) {
                    that._oDialog.getModel().setProperty("/Settings", hybrisSettings);
                    oDialog.setBusy(false);
                }
            };

            var criModel = this._oDialog.getModel("CRI");
            criModel.setHeaders({"If-Match": "*"});

            this.loadSetting('HYBRIS_CLIENT_ID', 'INT_VALUE', function (success, value) {
                if (success && value !== null) {
                    hybrisSettings.ClientId = value;
                }

                onSettingsLoaded(success);
            });

            this.loadSetting('HYBRIS_MARKETING_AREA_ID', 'STRING_VALUE', function (success, value) {
                if (success && value !== null) {
                    hybrisSettings.MarketingAreaId = value;
                }

                onSettingsLoaded(success);
            });

            criModel.setHeaders({});


            if (customerList) {
                this._oDialog.getModel().setProperty("/Customers", customerList);
            }
        },
        validateGroupName: function (event) {
            var value = event.getParameter("newValue");
            this._oDialog.getModel().setProperty("/ValidTargetGroup", value != "");
        },
        onCreateTargetGroup: function () {
            var model = this._oDialog.getModel();
            var that = this;

            this._oDialog.setBusy(true);

            var settings = this._oDialog.getModel().getProperty("/Settings");

            var TGpayload = {
                "TargetGroupName": model.getProperty("/TargetGroupName"),
                "TargetGroupDescription": model.getProperty("/TargetGroupDescription"),
                "TargetGroupMemberType":"03",
                "MarketingArea": settings.MarketingAreaId
            };


            var targetGroupUrl = "/TargetGroups";
            if (settings.ClientId && settings.ClientId != "") {
                targetGroupUrl += "?sap-client=" + settings.ClientId;
            }

            var hybrisTGModel =  new ODataModel("/hybris/API_MKT_TARGET_GROUP_SRV", {
                json: true
            });

            var batch = [];
            hybrisTGModel.setHeaders({
                "Content-ID": 1
            });

            batch.push(hybrisTGModel.createBatchOperation(targetGroupUrl, "POST", TGpayload, null));

            hybrisTGModel.setHeaders(null);

            var customers = model.getProperty("/Customers");
            customers.forEach(function (customer) {
                var tgcPayload = {
                    InteractionContactOrigin: settings.TargetGroupOrigin,
                    InteractionContactId: customer.OriginId
                };
                batch.push(hybrisTGModel.createBatchOperation('$1/TargetGroupInteractionContacts', "POST", tgcPayload, null));
            });

            hybrisTGModel.addBatchChangeOperations(batch);
            hybrisTGModel.submitBatch(
                function (e) {
                    MessageBox.success("Target Group created in SAP Hybris Marketing Cloud.", {
                        onClose: function () {
                            that._oDialog.setBusy(false);
                            that._oDialog.close();
                        }
                    });
                },
                function (e) {
                    MessageBox.error("Could not create target group at this time", {
                        onClose: function () {
                            that._oDialog.setBusy(false);
                            that._oDialog.close();
                        }
                    });
                }
            );
        },
        onCloseDialog : function () {
            this._getDialog().close();
        }
    });
});