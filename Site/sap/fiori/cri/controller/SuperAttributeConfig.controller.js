//noinspection JSValidateJSDoc
sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/fiori/cri/service/ErrorService",
        "sap/ui/model/json/JSONModel",
        "sap/m/Dialog",
        "sap/m/Text",
        "sap/m/Button"
    ],
    /**
     * Settings Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.fiori.cri.service.ErrorService} ErrorService ErrorService
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.m.Dialog} Dialog Dialog
     * @param {sap.m.Text} Text Text
     * @param {sap.m.Button} Button Button
     * @returns {*} Admin Controller
     */
    function (BaseController, ErrorService, JSONModel, Dialog, Text, Button) {
        "use strict";

        return BaseController.extend("sap.fiori.cri.controller.SuperAttributeConfig", {
            /**
             * Controller init
             */
            onInit: function () {
                var oJSONModel = new JSONModel({
                    Attributes: []
                });


                this.getView().setModel(oJSONModel);
            },
            onBeforeRendering: function (event) {
                var model = this.getView().getModel();

                var criModel = this.getView().getModel('CRI');
                var oBusyDialog = this.getView().byId("admBusyDialog");
                oBusyDialog.open();

                criModel.read("/ConfigAttributeTypes", {
                    success: function (data) {
                        try {
                        var mappedAttributes = [];

                        data.results.forEach(function (attribute) {
                            mappedAttributes.push( {
                                Id: attribute['ATTRIBUTE_ID'],
                                AttributeName: attribute['DESCRIPTION'],
                                ShowOnFilter: attribute['IS_FILTER'] ? true : false,
                                ShowOnDetail: attribute['IS_SHOW_DETAILS'] ? true : false,
                                IsSensitive: attribute['IS_SENSITIVE'] ? true : false
                            });
                        });

                        model.setProperty("/Attributes", mappedAttributes);
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }
                        oBusyDialog.close();
                    },
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                    }
                });
            },
            changedSetup: function (event) {
                this.enableSaveButton(true);
                var attribute = event.getSource().getParent().getBindingContext().getObject();
                attribute.needsUpdate = true;
            },
            save: function (event) {
                var attributes = this.getView().getModel().getProperty("/Attributes");
                var model = this.getView().getModel("CRI");
                var that = this;

                var started = 0;
                var completed = 0;
                var errors = 0;
                
                attributes.forEach(function (attribute) {
                    if (attribute.needsUpdate) {
                        var update = {
                            IS_FILTER: attribute.ShowOnFilter ? 1 : 0,
                            IS_SHOW_DETAILS: attribute.ShowOnDetail ? 1 : 0,
                            IS_SENSITIVE: attribute.IsSensitive ? 1 : 0
                        };

                        started++;
                        model.update("/ConfigAttributeTypes(" + attribute.Id + ")", update, {
                            //eTag: "*",
                            success: function () {
                                completed++;
                                attribute.needsUpdate = false;
                                if (started == completed && errors == 0) {
                                    that.showSaveSuccessDialog();
                                    that.getView().byId("idConfigPanel").setBusy(false);
                                } else if (started == completed) {
                                    that.showSaveErrorDialog(errors);
                                    that.getView().byId("idConfigPanel").setBusy(false);
                                }
                                
                            },
                            error: function () {
                                completed++;
                                errors++;
                                if (started == completed) {
                                    that.showSaveErrorDialog(errors);
                                    that.getView().byId("idConfigPanel").setBusy(false);
                                }
                            }
                        });
                                        
                    }
                });

                if (started > 0) {
                    this.enableSaveButton(false);
                    this.getView().byId("idConfigPanel").setBusy(true);
                }
            },
            cancel: function (event) {

            },
            enableSaveButton: function (sEnabled) {
                this.getView().byId("idSaveButton").setEnabled(sEnabled);
            },
            showSaveSuccessDialog: function () {
                this.showDialog('Success', 'Your changes have been saved.');
            },
            showSaveErrorDialog: function (errorCount) {
                this.showDialog('Error', 'Not all changes could not be saved. There were ' + errorCount + ' errors.');
                this.enableSaveButton(true);
            },
            showDialog: function (sState, sMessage) {
                var dialog = new Dialog({
                    title: sState,
                    type: 'Message',
                    state: sState,
                    content: new Text({
                        text: sMessage
                    }),
                    beginButton: new Button({
                        text: 'OK',
                        press: function () {
                            dialog.close();
                        }
                    }),
                    afterClose: function() {
                        dialog.destroy();
                    }
                });

                dialog.open();
            }
        });
    });