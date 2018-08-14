//noinspection JSValidateJSDoc
sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/fiori/cri/service/DynamicLabel",
        "sap/fiori/cri/service/ErrorService",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageBox",
        "sap/m/Dialog",
        "sap/m/Button",
        "sap/m/FlexBox",
        "sap/ui/core/util/File",
        "sap/fiori/cri/control/FileInput"
    ],
    /**
     * Settings Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.fiori.cri.service.DynamicLabel} DynamicLabel Dynamic Label Service
     * @param {sap.fiori.cri.service.ErrorService} ErrorService Error Service
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.m.MessageBox} MessageBox Message Box
     * @param {sap.m.Dialog} Dialog Dialog
     * @param {sap.m.Button} Button Button
     * @param {sap.m.FlexBox} FlexBox FlexBox
     * @param {sap.ui.core.util.File} FileUI5 File
     * @param {sap.fiori.cri.control.FileInput} FileInput FileInput
     * @returns {*} At Risk Customers Controller
     */
    function (BaseController, DynamicLabel, ErrorService, JSONModel, MessageBox, Dialog, Button, FlexBox, FileUI5, FileInput) {
        "use strict";

        return BaseController.extend("sap.fiori.cri.controller.LabelDefinition", {
            /**
             * Controller init
             */
            onInit: function () {
                var oJSONModel = new JSONModel({
                    Labels: [],
                    UseCaseKey: "CHURN",
                    Language: "en-US"
                });

                this.getView().setModel(oJSONModel);
            },
            onBeforeRendering: function (event) {
                this.loadLabels("LabelDefinition", "en-US");
                this.getView().byId("idLabelDefinition").setBusy(true);
                this.loadAllSavedLabels(function (errorCount) {
                    if (errorCount > 0) {
                        MessageBox.error("Could not save all default labels: " + errorCount + " could not be saved.", {
                            title: "Failed to save"
                        });
                    }

                    this.getView().byId("idLabelDefinition").setBusy(false);
                }.bind(this));
            },
            loadAllSavedLabels: function (onDone) {
                var viewModel = this.getView().getModel();
                var language = viewModel.getProperty("/Language");
                var criModel = this.getView().getModel("CRI");
                DynamicLabel.loadLabels(criModel,
                    {
                        language: language,
                        currentUseCase: viewModel.getProperty("/UseCaseKey")
                    },
                    function (labels, missing) {
                        viewModel.setProperty("/Labels", labels);

                        if (missing.length > 0) {
                            var savesNeeded = missing.length;
                            var savesDone = 0;
                            var errorCount = 0;

                            missing.forEach(function (labelToUpload) {
                                criModel.create("/UILabelDefinition", labelToUpload, {
                                    success: function () {
                                        savesDone++;
                                        if (savesDone == savesNeeded && onDone) {
                                            onDone(errorCount);
                                        }
                                    },
                                    error: function () {
                                        errorCount++;
                                        savesDone++;
                                        if (savesDone == savesNeeded && onDone) {
                                            onDone(errorCount);
                                        }
                                    }
                                });
                            });
                        } else if (onDone) {
                            onDone();
                        }
                    }
                );
            },
            resetLabel: function (event) {
                var label = event.getSource().getBindingContext().getObject();
                label["Label"] = label["LabelDefault"];
                this.getView().getModel().refresh();
                this.enableSaveButton(true);
            },
            labelChanged: function (oEvent) {
                var oRow = oEvent.getSource().getBindingContext();
                var sPath = oRow.getPath();
                this.getView().getModel().setProperty(sPath + "/edited", true);
                this.enableSaveButton(true);
            },
            onUseCaseChange: function (event) {
                this.loadAllSavedLabels();
            },
            enableSaveButton: function (sEnabled) {
                this.getView().byId("idSaveButton").setEnabled(sEnabled);
            },
            /**
             * Convert and export label model to i18n format
             */
            exportLabels: function () {
                var oModel = this.getView().getModel();
                var aLabels = oModel.getProperty("/Labels");
                var sConvertedLabels = DynamicLabel.createI18NfromLabelJSON(aLabels);
                FileUI5.save(sConvertedLabels, "labels", "properties");
            },
            /**
             * Converts file to JSON format, adding missing properties based on existing labels
             *
             * @param oLabelFile Raw file object containing the imported labels
             * @param callback Callback function for after processing completed
             * @private
             */
            _processImportedLabels: function (oLabelFile, callback) {
                var fileReader = new FileReader();

                var that = this;

                fileReader.onloadend = function () {
                    var sI18Nstring = fileReader.result;
                    var aImportedLabels = DynamicLabel.createLabelJSONfromI18N(sI18Nstring) || [];
                    var oModel = that.getView().getModel();
                    var aCurrentLabels = oModel.getProperty("/Labels");

                    var aLabelsMissingFromImport = [];

                    aCurrentLabels.forEach(function (oCurrentLabel) {
                        var oImportedLabel = aImportedLabels.find(function (oTestLabel) {
                            return oCurrentLabel.Page === oTestLabel.Page && oCurrentLabel.Component === oTestLabel.Component;
                        });

                        if(oImportedLabel) {
                            oImportedLabel.LabelDefault = oCurrentLabel.LabelDefault;
                            oImportedLabel.CascadeFromDefault = oCurrentLabel.CascadeFromDefault;
                        } else {
                            aLabelsMissingFromImport.push(oCurrentLabel);
                        }
                    });

                    callback(aImportedLabels, aLabelsMissingFromImport);
                };

                fileReader.readAsText(oLabelFile);
            },
            /**
             * Import labels from file
             */
            importLabels: function () {
                var that = this;

                var uploader = new FileInput();

                var uploaderContainer = new FlexBox({
                    justifyContent: sap.m.FlexJustifyContent.Center,
                    alignItems: sap.m.FlexAlignItems.Center,
                    items: uploader
                });

                var aLabels = null;
                var oModel = that.getView().getModel();

                var uploadButton = new Button({
                    enabled: false,
                    text: 'Import',
                    type: 'Accept',
                    press: function () {
                        oModel.setProperty("/Labels", aLabels);
                        that.labelChanged();
                        that.uploadDialog.close();
                        that.saveLabels();
                    }
                });

                uploader.attachEvent('fileChanged', function (oEvent) {
                    var file = oEvent.getParameter("file");

                    if(file) {
                        that._processImportedLabels(file, function (aImportedLabels, aMissingLabels) {
                            if(aMissingLabels.length === 0) {
                                aLabels = aImportedLabels;
                                uploadButton.setEnabled(true);
                            } else {
                                uploadButton.setEnabled(false);
                                aLabels = null;
                                uploader.reset();
                                alert("Invalid label file");
                            }
                        });
                    }
                });

                this.uploadDialog = new Dialog({
                    title: "Select Label Properties File",
                    content: uploaderContainer,
                    horizontalScrolling: false,
                    verticalScrolling: false,
                    beginButton: uploadButton,
                    endButton: new Button({
                        text: 'Cancel',
                        press: function () {
                            that.uploadDialog.close();
                        }
                    })
                });

                this.uploadDialog.open();
            },
            saveLabels: function () {
                var that = this;
                var model = this.getView().getModel();

                var labels = model.getProperty("/Labels");
                var useCaseKey = model.getProperty("/UseCaseKey");
                var language = model.getProperty("/Language");

                this.getView().byId("idLabelDefinition").setBusy(true);
                var onSavingDone = function (errorCount) {
                    if (errorCount > 0) {
                        MessageBox.error("Could not save all labels: " + errorCount + " could not be saved.", {
                            title: "Failed to save"
                        });
                    } else {
                        MessageBox.success("All labels updated.");
                    }

                    that.getView().byId("idLabelDefinition").setBusy(false);
                    that.enableSaveButton(false);
                };


                var savesNeeded = labels.reduce(function(prevValue, currValue){
                    
                    if(currValue.edited){
                        prevValue++;
                    }
                    return prevValue;
                },0);
                var errorCount = 0;
                var savesDone = 0;
                var parameters = {
                    success: function () {
                        try {
                            savesDone++;
                            if (savesDone == savesNeeded) {
                                onSavingDone(errorCount);
                            }
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }
                    },
                    error: function () {
                        errorCount++;
                        savesDone++;
                        if (savesDone == savesNeeded) {
                            onSavingDone(errorCount);
                        }
                    }
                };

                var criModel = this.getView().getModel("CRI");
                labels.forEach(function (label) {
                    if(label.edited){
                        var labelDetails = {
                            "LABEL": label["Label"]
                        };
    
                        if (label["CascadeFromDefault"]) {
                            labelDetails["REACTION_TYPE"] = useCaseKey;
                            labelDetails["PAGE"] = label["Page"];
                            labelDetails["COMPONENT"] = label["Component"];
                            labelDetails["LANGUAGE"] = language;
    
                            criModel.create("/UILabelDefinition", labelDetails, parameters);
                        } else {
                            var pathToUpdate = "REACTION_TYPE='" + useCaseKey + "',PAGE='" + label["Page"] + "',COMPONENT='" + label["Component"] + "',LANGUAGE='" + language + "'";
    
                            parameters.eTag = "*";
                            criModel.update("/UILabelDefinition(" + pathToUpdate + ")", labelDetails, parameters);
                            parameters.eTag = undefined;
                        }
                    }
                    
                });
            }
        });
    });