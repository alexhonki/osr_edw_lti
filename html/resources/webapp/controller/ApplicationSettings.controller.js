//noinspection JSValidateJSDoc
sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/fiori/cri/service/ErrorService",
        "sap/ui/core/UIComponent",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox"
    ],
    /**
     * Settings Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.fiori.cri.service.ErrorService} ErrorService ErrorService
     * @param {sap.ui.core.UIComponent} UIComponent UIComponent
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.m.MessageBox} MessageBox MessageBox
     * @returns {*} Controller
     */
    function (BaseController, ErrorService, UIComponent, JSONModel, MessageBox) {
        "use strict";

        return BaseController.extend("sap.fiori.cri.controller.ApplicationSettings", {
            onInit: function () {
                var oJSONModel = new JSONModel({});
                this.getView().setModel(oJSONModel);
            },
            onBeforeRendering: function () {
                this.loadCurrent();
            },
            loadCurrent: function () {
                var properties = this.getView().getModel();
                var model = this.getView().getModel("CRI");
                var oBusyDialog = this.getView().byId("admBusyDialog");
                oBusyDialog.open();
                model.read("/UseCaseConfig", {
                    success: function (oData) {
                        try {
                            oData.results.forEach(function (useCase) {
                                if (useCase["IS_ENABLED"] == 1) {
                                    properties.setProperty("/ActiveUseCase", useCase["REACTION_TYPE"]);
                                    properties.setProperty("/SelectedUseCase", useCase["REACTION_TYPE"]);
                                }
                            });
                            oBusyDialog.close();
                        } catch (oError){
                            ErrorService.raiseGenericError(oError);
                        }
                    },
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                    }
                });
            },
            selectUseCase: function (event) {
                var properties = this.getView().getModel();
                var newUseCaseKey = this.getView().getModel().getProperty("/SelectedUseCase");
                var currentUseCaseKey = properties.getProperty("/ActiveUseCase");
                if (newUseCaseKey == currentUseCaseKey) {
                    return;
                }
                var that = this;
                MessageBox.confirm(
                    "Activate '" + event.getParameter("selectedItem").getText() + "' use case?", {
                        title: "Activate",
                        onClose: function(oAction) {
                            if (oAction == MessageBox.Action.OK) {
                                that.getView().getModel('CRI').update("/UseCaseConfig('" + newUseCaseKey + "')", {
                                        IS_ENABLED: 1
                                    }, {
                                        eTag: "*",
                                        success: function () {
                                            try {
                                                properties.setProperty("/ActiveUseCase", newUseCaseKey);
                                                properties.setProperty("/SelectedUseCase", newUseCaseKey);
                                            } catch (oError) {
                                                ErrorService.raiseGenericError(oError);
                                            }
                                        },
                                        error: function (oError) {
                                            ErrorService.raiseGenericError(oError);
                                            properties.setProperty("/SelectedUseCase", currentUseCaseKey);
                                        }
                                    }
                                );
                            } else {
                                properties.setProperty("/SelectedUseCase", currentUseCaseKey);
                            }
                        }
                    }
                );
            },
            enableSaveButton: function (sEnabled) {
                this.getView().byId("idSaveButton").setEnabled(sEnabled);
            },
            onSave: function () {

            },
            onCancel: function () {

            },
            editUseCase: function (oEvent) {
                var useCaseId = oEvent.getSource().data("target");
                UIComponent.getRouterFor(this).navTo("useCaseSettings", {useCaseId: useCaseId});
            }
        });
    }
);