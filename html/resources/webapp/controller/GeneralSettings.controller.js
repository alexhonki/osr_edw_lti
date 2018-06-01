//noinspection JSValidateJSDoc
sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/fiori/cri/service/ErrorService",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageBox"
    ],
    /**
     * Settings Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.fiori.cri.service.ErrorService} ErrorService Error Service
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.ui.model.Filter} Filter Filter
     * @param {sap.ui.model.FilterOperator} FilterOperator Filter Operator
     * @param {sap.m.MessageBox} MessageBox Message Box
     * @returns {*} At Risk Customers Controller
     */
    function (BaseController, ErrorService, JSONModel, Filter, FilterOperator, MessageBox) {
        "use strict";

        return BaseController.extend("sap.fiori.cri.controller.GeneralSettings", {
            /**
             * Controller init
             */
            onInit: function () {
                var oJSONModel = new JSONModel({});
                this.getView().setModel(oJSONModel);
            },
            onBeforeRendering: function () {
                this.loadLabels("GeneralSettings", "en-US");
                this.loadCurrent();
            },
            loadCurrent: function () {
                var properties = this.getView().getModel();
                var model = this.getView().getModel("CRI");

                var predictionDateLoaded = false;
                var trainingDateLoaded = false;
                var dataRetentionLoaded = false;
                var onLoaded = function () {
                    if (predictionDateLoaded && dataRetentionLoaded && trainingDateLoaded) {
                        properties.attachPropertyChange(this.updateSettings.bind(this));
                    }
                }.bind(this);
                var oBusyDialog = this.getView().byId("admBusyDialog");
                oBusyDialog.open();
                model.read("/ConfigPredictionDate", {
                    success: function (oData) {
                        try {
                            predictionDateLoaded = true;
                            oData.results.forEach(function (dateSetting) {
                                if (dateSetting["IS_ENABLED"] == 1) {
                                    var defaultDate = dateSetting["SEQ"] + "";
                                    var defaultFixed = new Date(dateSetting["TO_DATE"]);
                                    properties.setProperty("/SelectedPredictionDate", defaultDate);
                                    properties.setProperty("/SelectedFixedDate", defaultFixed);
                                    properties.setProperty("/PriorPredictionDate", defaultDate);
                                    properties.setProperty("/PriorFixedDate", defaultFixed);
                                    onLoaded();
                                }
                            });
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }
                        oBusyDialog.close();
                    },
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                        oBusyDialog.close();
                    }
                });
                oBusyDialog.open();
                model.read("/Config", {
                    filters: [
                        new Filter("BUCKET_ID", FilterOperator.EQ,'DATA_RETENTION_PERIOD')
                    ],
                    success: function (oData) {
                        try {
                            dataRetentionLoaded = true;
                            var result = oData.results[0];
                            properties.setProperty("/PreservationMonths", result["FROM_VALUE"]);
                            onLoaded();
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }
                        oBusyDialog.close();
                    },
                    error: function (oError) {
                        oBusyDialog.close();
                        ErrorService.raiseGenericError(oError);
                    }
                });
                oBusyDialog.open();
                model.read("/ConfigTrainingDate", {
                    success: function (oData) {
                        try {
                            trainingDateLoaded = true;
                            oData.results.forEach(function (dateSetting) {
                                if (dateSetting["IS_ENABLED"] == 1) {
                                    var defaultKey = dateSetting["SEQ"] + "";
                                    var defaultTrainDate = new Date(dateSetting["TO_DATE"]);
                                    properties.setProperty("/TrainFixedDate", defaultTrainDate);
                                    properties.setProperty("/TrainFixedDateKey", defaultKey);
                                    onLoaded();
                                }
                            });
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }
                        oBusyDialog.close();
                    },
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                        oBusyDialog.close();
                    }
                });
            },
            updateSettings: function (event) {
                var path = event.getParameter("path");
                if (path == "/SelectedPredictionDate" || path == "/SelectedFixedDate" || path == "/PreservationMonths" || path =="/TrainFixedDate") {
                    this.enableSaveButton(true);
                }
            },
            enableSaveButton: function (sEnabled) {
                this.getView().byId("idSaveButton").setEnabled(sEnabled);
            },
            onCancel: function () {
                this.enableSaveButton(false);
                var properties = this.getView().getModel();
                properties.setProperty("/SelectedPredictionDate", properties.getProperty("/PriorPredictionDate"));
                properties.setProperty("/SelectedFixedDate", properties.getProperty("/PriorFixedDate"));
            },
            onSave: function () {
                var properties = this.getView().getModel();
                var model = this.getView().getModel("CRI");

                var dateKey  = properties.getProperty("/SelectedPredictionDate");

                var update = {
                    IS_ENABLED: "1"
                };

                if (dateKey == 3) {
                    var date  = properties.getProperty("/SelectedFixedDate");
                    update["STR_VALUE"] = date.getTime() + "";
                }
				
				var trainKey = properties.getProperty("/TrainFixedDateKey");
				var updateTrainDate = {
					IS_ENABLED: "1",
					STR_VALUE: properties.getProperty("/TrainFixedDate").getTime() + ""
				};
                var dateSaved = false;
                var daysSaved = false;
                var error = false;
                var onFinished = function () {
                    if (dateSaved && daysSaved) {
                        if (error) {
                            MessageBox.error('Changes could not be saved.');
                        } else {
                            MessageBox.success('Your changes have been saved.');
                            this.enableSaveButton(false);
                        }

                        this.getView().byId("idGeneralSettingsPage").setBusy(false);
                    }
                }.bind(this);

                this.getView().byId("idGeneralSettingsPage").setBusy(true);

                model.update("/ConfigPredictionDate(" + dateKey + ")", update, {
                    eTag: "*",
                    success: function () {
                        try {
                            dateSaved = true;
                            onFinished();
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }
                    },
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                        dateSaved = true;
                        error = true;
                        onFinished();
                    }
                });
                
                 model.update("/ConfigTrainingDate(" + trainKey + ")", updateTrainDate, {
                    eTag: "*",
                    success: function () {
                        try {
                            dateSaved = true;
                            onFinished();
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }
                    },
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                        dateSaved = true;
                        error = true;
                        onFinished();
                    }
                });

                model.update("/Config(BUCKET_ID='DATA_RETENTION_PERIOD',SEQ=1)",
                    {
                        "FROM_VALUE": properties.getProperty("/PreservationMonths") + ""
                    },
                    {
                        eTag: "*",
                        success: function () {
                            try {
                                daysSaved = true;
                                onFinished();
                            } catch (oError) {
                                ErrorService.raiseGenericError(oError);
                            }
                        },
                        error: function (oError) {
                            ErrorService.raiseGenericError(oError);
                            daysSaved = true;
                            error = true;
                            onFinished();
                        }
                    }
                );
            }
        });
    });