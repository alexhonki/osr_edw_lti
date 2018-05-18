//noinspection JSValidateJSDoc
sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/fiori/cri/service/ErrorService",
        "sap/ui/model/json/JSONModel"
    ],
    /**
     * Settings Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.fiori.cri.service.ErrorService} ErrorService Error Service
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @returns {*} At Risk Customers Controller
     */
    function (BaseController, ErrorService, JSONModel) {
        "use strict";

        return BaseController.extend("sap.fiori.cri.controller.HybrisSettings", {
            /**
             * Controller init
             */
            onInit: function () {
                var oJSONModel = new JSONModel({});
                this.getView().setModel(oJSONModel);

            },
            onBeforeRendering: function () {
                this.loadLabels("HybrisSettings", "en-US");

                this.loadSettings();
            },
            loadSetting: function (key, type, onDone) {
                var criModel = this.getView().getModel('CRI');
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
                            //ErrorService.raiseGenericError(oError);
                            onDone(false);
                        }
                    }
                );
            },
            loadSettings: function () {
                this.getView().byId("hybrisSettings").setBusy(true);
                this.getView().byId("idSaveButton").setEnabled(false);

                var criModel = this.getView().getModel('CRI');
                var model = this.getView().getModel();

                var that = this;

                var settingsLoading = 2;

                var onSettingsLoaded = function (success) {
                    if (--settingsLoading == 0) {
                        that.getView().byId("hybrisSettings").setBusy(false);
                        model.attachPropertyChange(that.onSettingsChange.bind(that));
                    }
                };

                criModel.setHeaders({"If-Match": "*"});

                this.loadSetting('HYBRIS_CLIENT_ID', 'INT_VALUE', function (fetchSuccess, value) {
                    if (fetchSuccess) {
                        model.setProperty("/clientId", value);
                        onSettingsLoaded(true);
                    } else {
                        that.createSetting('HYBRIS_CLIENT_ID', 'INT_VALUE', null, function (createSuccess) {
                            model.setProperty("/clientId", "");
                            onSettingsLoaded(createSuccess);
                        });
                    }

                });

                this.loadSetting('HYBRIS_MARKETING_AREA_ID', 'STRING_VALUE', function (fetchSuccess, value) {
                    if (fetchSuccess) {
                        model.setProperty("/marketingAreaId", value);
                        onSettingsLoaded(true);
                    } else {
                        that.createSetting('HYBRIS_MARKETING_AREA_ID', 'STRING_VALUE', "CXXGLOBAL", function (createSuccess) {
                            model.setProperty("/marketingAreaId", "CXXGLOBAL");
                            onSettingsLoaded(createSuccess);
                        });
                    }
                });

                criModel.setHeaders({});
            },
            onSettingsChange: function (oEvent) {
                this.getView().byId("idSaveButton").setEnabled(true);
            },
            createSetting: function (key, type, value, onDone) {
                var createPayload = {};
                createPayload['KEY'] = key;
                createPayload[type] = value;

                this.getView().getModel('CRI').create("/SystemSettings", createPayload, {
                    success: function () {
                        try {
                            onDone(true);
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }
                    },
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                        onDone(false);
                    }
                });
            },
            updateSetting: function (key, type, value, onDone) {
                var updatePayload = {};
                updatePayload[type] = value;

                this.getView().getModel('CRI').update("/SystemSettings('" + key + "')", updatePayload, {
                    eTag: "*",
                    success: function () {
                        try {
                            onDone(true);
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }
                    },
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                        onDone(false);
                    }
                });
            },
            onSave: function (oEvent) {
                this.getView().byId("hybrisSettings").setBusy(true);
                this.getView().byId("idSaveButton").setEnabled(false);

                var model = this.getView().getModel();

                var that = this;

                var settingsSaving = 2;

                var onSettingsSaved = function (success) {
                    if (--settingsSaving == 0) {
                        that.getView().byId("hybrisSettings").setBusy(false);
                    }
                };

                var clientId = model.getProperty("/clientId");
                var marketingId = model.getProperty("/marketingAreaId");

                this.updateSetting('HYBRIS_CLIENT_ID', 'INT_VALUE', parseInt(clientId, 10), function (success) {
                    onSettingsSaved(success);
                });

                this.updateSetting('HYBRIS_MARKETING_AREA_ID', 'STRING_VALUE', marketingId, function (success) {
                    onSettingsSaved(success);
                });
            }
        });
    });