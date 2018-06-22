//noinspection JSValidateJSDoc
sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/fiori/cri/service/ErrorService",
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/UIComponent",
        "sap/ui/core/TextAlign",
        "sap/ui/layout/GridData",
        "sap/ui/layout/Grid",
        "sap/m/HBox",
        "sap/m/StepInput",
        "sap/m/Label",
        "sap/m/Title",
        "sap/m/Button",
        "sap/m/ButtonType",
        "sap/m/Input",
        "sap/m/FlexBox",
        "sap/m/VBox",
        "sap/m/Dialog",
        "sap/m/Text",
        "sap/m/MessageBox"
    ],

    /**
     * Settings Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.fiori.cri.service.ErrorService} ErrorService ErrorService
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.ui.core.UIComponent} UIComponent UIComponent
     * @param {sap.ui.core.TextAlign} TextAlign TextAlign
     * @param {sap.ui.layout.GridData} GridData GridData
     * @param {sap.ui.layout.Grid} Grid Grid
     * @param {sap.m.HBox} HBox HBox
     * @param {sap.m.StepInput} StepInput StepInput
     * @param {sap.m.Label} Label Label
     * @param {sap.m.Title} Title Title
     * @param {sap.m.Button} Button Button
     * @param {sap.m.ButtonType} ButtonType ButtonType
     * @param {sap.m.Input} Input Input
     * @param {sap.m.FlexBox} FlexBox FlexBox
     * @param {sap.m.VBox} VBox VBox
     * @param {sap.m.Dialog} Dialog Dialog
     * @param {sap.m.Text} Text Text
     * @param {sap.m.MessageBox} MessageBox Message Box
     * @returns {*} Controller
     */
    function (BaseController, ErrorService, JSONModel, UIComponent, TextAlign, GridData, Grid, HBox, StepInput, Label,
              Title, Button, ButtonType, Input, FlexBox, VBox, Dialog, Text, MessageBox) {
        "use strict";

        return BaseController.extend("sap.fiori.cri.controller.UseCaseSettings", {
            /**
             * Controller init
             */
            onInit: function () {
                var oJSONModel = new JSONModel({});
                this.getView().setModel(oJSONModel);
                var oRouter = UIComponent.getRouterFor(this);
                var that = this;
                oRouter.attachRouteMatched(function(oEvent) {
                    if (oEvent.getParameter("name") !== "useCaseSettings") {
                        return;
                    }

                    this.enableSaveButton(false);

                    var useCaseId = oEvent.getParameter("arguments").useCaseId;
                    that.loadUseCaseSettings(useCaseId);
                }, this);
            },
            onBeforeRendering: function () {
                this.loadLabels("UseCaseSettings", "en-US");
                this.getView().byId("idSettingsForm").setBusyIndicatorDelay(0);
            },
            loadUseCaseSettings: function (useCaseId) {
                var criModel = this.getView().getModel('CRI');
                var viewModel = this.getView().getModel();
                viewModel.setProperty("/UseCaseId", useCaseId);

                var that = this;

                this.getView().byId("idSettingsForm").setBusy(true);

                criModel.setHeaders({"If-Match": "*"});
                criModel.read("/UseCaseConfig('" + useCaseId + "')", {urlParameters: {"$expand": "Config"}, eTag: "*" ,
                    success: function (oData) {
                        try {
                            viewModel.setProperty("/UseCaseTitle", oData["DESCRIPTION"]);
                            var settingsGrouped = {};
                            var config = oData["Config"].results;
                            config.forEach(function (setting) {
                                if (setting["IS_ENABLED"] == 0) {
                                    return;
                                }

                                var value = null;
                                var defaultValue = null;
                                var control = null;

                                if (setting["TO_VALUE"] != null) {
                                    value = {
                                        from: setting["FROM_VALUE"],
                                        to: setting["TO_VALUE"]
                                    };

                                    defaultValue = {
                                        from: setting["FROM_DEFAULT"],
                                        to: setting["TO_DEFAULT"]
                                    };

                                    control = new HBox({
                                        alignItems: "Center",
                                        items: [
                                            new StepInput({
                                                min: 0,
                                                max: 2147483647,
                                                value: "{value/from}",
                                                valueLiveUpdate: true,
                                                width: "120px"
                                            }).addStyleClass("sapUiSmallMarginBeginEnd"),
                                            new Label({
                                                text: "to"
                                            }),
                                            new StepInput({
                                                min: 0,
                                                max: 2147483647,
                                                value: "{value/to}",
                                                valueLiveUpdate: true,
                                                width: "120px"
                                            }).addStyleClass("sapUiSmallMarginBeginEnd"),
                                            new Label({
                                                text: {
                                                    path: "unit"
                                                }
                                            })
                                        ]
                                    });
                                } else {
                                    value = setting["FROM_VALUE"];
                                    defaultValue = setting["FROM_DEFAULT"];
                                    control = new HBox({
                                        alignItems: "Center",
                                        items: [
                                            new StepInput({
                                                min: 0,
                                                max: 2147483647,
                                                value: "{value}",
                                                valueLiveUpdate: true,
                                                width: "120px"
                                            }).addStyleClass("sapUiSmallMarginBeginEnd"),
                                            new Label({
                                                text: {
                                                    path: "unit"
                                                }
                                            })
                                        ]
                                    });
                                }

                                var group = setting["GROUP"];
                                var settingConfig = {
                                    updatePath: "BUCKET_ID='" + setting["BUCKET_ID"] + "',SEQ=" + setting['SEQ'] + ",REACTION_TYPE='" + useCaseId + "'",
                                    name: setting["DESCRIPTION"],
                                    unit: setting["UNIT_OF_MEASURE"],
                                    value: value,
                                    defaultValue: defaultValue,
                                    control: control
                                };

                                if (settingsGrouped.hasOwnProperty(group)) {
                                    settingsGrouped[group].push(settingConfig);
                                } else {
                                    settingsGrouped[group] = [settingConfig];
                                }
                            });

                            var controls = [];

                            for (var group in settingsGrouped) {
                                if (settingsGrouped.hasOwnProperty(group)) {
                                    controls.push({
                                        group: group,
                                        items: settingsGrouped[group]
                                    });
                                }
                            }

                            viewModel.detachPropertyChange(that.onSettingsChange);

                            viewModel.setProperty("/SettingsControls", controls);

                            viewModel.attachPropertyChange(that.onSettingsChange.bind(that));

                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                            // TODO: Show no data loaded
                        } finally {
                            that.getView().byId("idSettingsForm").setBusy(false);
                        }
                    },
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                        that.getView().byId("idSettingsForm").setBusy(false);
                        // TODO: Show no data loaded
                    }
                });
                criModel.setHeaders({});
            },
            createSettingsGroup: function (sId, oContext) {
                var titleRow = new Title({text: {path: "group"}});

                var items = oContext.getProperty("items");
                var itemsPath = oContext.getPath("items");

                var gridContent = [];

                items.forEach(function (item, index) {
                    var itemPath = itemsPath + "/" + index;

                    var editButton = new Button({icon: "sap-icon://edit", type: ButtonType.Transparent});

                    var labelWithEdit = new HBox({
                        alignItems: "Center",
                        items: [
                            new Label({textAlign : "End", text: {path: "name"}}),
                            editButton
                        ]
                    });

                    var saveButton = new Button({icon: "sap-icon://accept", type: ButtonType.Transparent});
					if(item.updatePath.includes('SEARCH_SCORE_THRESHOLD')){
						var inputWithSave = new HBox({
	                        visible: false,
	                        alignItems: "Center",
	                        items: [
	                            new Input({
	                            	placeholder: item.name, 
	                            	value: {
	                            		path: "name", 
	                            		type: "sap.ui.model.type.Integer", 
	                            		constraints: {
	                            			minimum: 0,
	                            			maximum: 100
	                            		}
	                            	}
	                            }),
	                            saveButton
	                        ]
                    	});
					} else{
						
	                    var inputWithSave = new HBox({
	                        visible: false,
	                        alignItems: "Center",
	                        items: [
	                            new Input({placeholder: item.name, value: {path: "name"}}),
	                            saveButton
	                        ]
	                    });
					}

                    editButton.attachPress(function () {
                        labelWithEdit.setVisible(false);
                        inputWithSave.setVisible(true);
                    });

                    saveButton.attachPress(function () {
                        inputWithSave.setVisible(false);
                        labelWithEdit.setVisible(true);


                    });

                    var labelItem = new FlexBox({
                        alignItems: "Center",
                        justifyContent: "End",
                        items: [
                            inputWithSave,
                            labelWithEdit,
                            new Label({textAlign : TextAlign.Right, text: ":"})
                        ]
                    });

                    labelItem.setLayoutData(new GridData({
                        span: "XL4 L4 M4 S4"
                    }));

                    var controlItem = new HBox({
                        alignItems: "Center",
                        items: [
                            item.control
                        ]
                    });

                    controlItem.setLayoutData(new GridData({
                        span: "XL8 L8 M8 S8"
                    }));


                    labelItem.bindObject(itemPath);
                    controlItem.bindObject(itemPath);

                    gridContent.push(labelItem, controlItem);
                });

                var itemsGrid = new Grid({
                    vSpacing: 0,
                    hSpacing: 0,
                    content: gridContent
                });

                itemsGrid.addStyleClass("sapUiSmallMarginTop");

                var settingsGroup = new VBox({
                    items: [
                        titleRow,
                        itemsGrid
                    ]
                });

                settingsGroup.setLayoutData(new GridData({
                    span: "XL6 L12 M12 S12"
                }));

                return settingsGroup;
            },
            onSettingsChange: function (oEvent) {
                var setting = oEvent.getParameter("context").getObject();
                setting.needsUpdate = true;
                var inputsValid = true;
                var groups = this.getView().getModel().getProperty("/SettingsControls");
                //var errorText = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("invalidInputError");
                var oMinMaxLowRisk = {max: groups[0].items[1].value.from,min:0},
                oMinMaxMedRisk = {min: groups[0].items[0].value.to, max: groups[0].items[2].value.from},
                oMinMaxHighRisk = {max: 100, min: groups[0].items[1].value.to};
                groups.forEach(function (group) {
                	
                   group.items.forEach(function (item) {
                   	var controls = item.control.getAggregation("items");
	                       controls.forEach(function (control) {
	                       	if(control.getBindingContext().getObject().updatePath.includes("SEARCH_SCORE_THRESHOLD")){
	                       		if (control.getMetadata().getName() == "sap.m.StepInput") {
	                               var min = 0;
	                               var max = 101;
	                               var value = control.getValue();
	                               control.setValueState("None");
	                               if (value < min || value > max) {
	                                   inputsValid = false;
	                                   control.setValueState("Error");
	                               }
	                           }
	                       	} else if(control.getBindingContext().getObject().updatePath.includes("CUSTOMER_RISK") 
	                       	&& control.getBindingContext().getObject().updatePath.includes("SEQ=1")) {
	                       		if (control.getMetadata().getName() == "sap.m.StepInput") {
	                               var min = oMinMaxLowRisk.min;
	                               var max = oMinMaxLowRisk.max;
	                               var value = control.getValue();
	                               control.setValueState("None");
	                               if (value < min || value > max) {
	                                   inputsValid = false;
	                                   control.setValueState("Error");
	                               }
	                           }
	                       	}else if(control.getBindingContext().getObject().updatePath.includes("CUSTOMER_RISK") 
	                       	&& control.getBindingContext().getObject().updatePath.includes("SEQ=2")) {
	                       		if (control.getMetadata().getName() == "sap.m.StepInput") {
	                               var min = oMinMaxMedRisk.min;
	                               var max = oMinMaxMedRisk.max;
	                               var value = control.getValue();
	                               control.setValueState("None");
	                               if (value < min || value > max) {
	                                   inputsValid = false;
	                                   control.setValueState("Error");
	                               }
	                           }
	                       	}else if(control.getBindingContext().getObject().updatePath.includes("CUSTOMER_RISK") 
	                       	&& control.getBindingContext().getObject().updatePath.includes("SEQ=3")) {
	                       		if (control.getMetadata().getName() == "sap.m.StepInput") {
	                               var min = oMinMaxHighRisk.min;
	                               var max = oMinMaxHighRisk.max;
	                               var value = control.getValue();
	                               control.setValueState("None");
	                               if (value < min || value > max) {
	                                   inputsValid = false;
	                                   control.setValueState("Error");
	                               }
	                           }
	                       	}else{
	                           if (control.getMetadata().getName() == "sap.m.StepInput") {
	                               var min = control.getMin();
	                               var max = control.getMax();
	                               var value = control.getValue();
	                               if (value < min || value > max) {
	                                   inputsValid = false;
	                               }
	                           }
	                       	}
	                       });
                   		
                   });
                });

                this.enableSaveButton(inputsValid);
            },
            onRestore: function () {
                var that = this;
                MessageBox.confirm(
                    "Restore all settings to default values?", {
                        title: "Reset",
                        onClose: function(oAction) {
                            if (oAction == MessageBox.Action.OK) {
                                var settings = that.getView().getModel().getProperty("/SettingsControls");
                                settings.forEach(function (settingGroup) {
                                    settingGroup.items.forEach(function (setting) {
                                        if (setting.value.from != null && setting.value.to != null) {
                                            setting.value.to = setting.defaultValue.to;
                                            setting.value.from = setting.defaultValue.from;
                                        } else {
                                            setting.value = setting.defaultValue;
                                        }

                                        setting.needsUpdate = true;
                                    });
                                });
                                that.getView().getModel().setProperty("/SettingsControls", settings);
                                that.onSave();
                            }
                        }
                    }
                );
            },
            enableSaveButton: function (sEnabled) {
                this.getView().byId("idSaveButton").setEnabled(sEnabled);
            },
            onSave: function () {
                var settings = this.getView().getModel().getProperty("/SettingsControls");
                var model = this.getView().getModel("CRI");
                var that = this;

                var started = 0;
                var completed = 0;
                var errors = 0;

                settings.forEach(function (settingGroup) {
                    settingGroup.items.forEach(function (setting) {
                        if (setting.needsUpdate) {
                            var update = null;
                            if (setting.value.from != null && setting.value.to != null) {
                                update = {
                                    DESCRIPTION: setting.name,
                                    FROM_VALUE: setting.value.from + "",
                                    TO_VALUE: setting.value.to + ""
                                };
                            } else {
                                update = {
                                    DESCRIPTION: setting.name,
                                    FROM_VALUE: setting.value + ""
                                };
                            }

                            started++;

                            model.update("/UseCaseSettings(" + setting.updatePath + ")", update, {
                                eTag: "*",
                                success: function () {
                                    completed++;
                                    if (started == completed && errors == 0) {
                                        that.showSaveSuccessDialog();
                                        that.getView().byId("idSettingsForm").setBusy(false);
                                    } else if (started == completed) {
                                        that.showSaveErrorDialog(errors);
                                        that.getView().byId("idSettingsForm").setBusy(false);
                                    }
                                },
                                error: function () {
                                    completed++;
                                    errors++;
                                    if (started == completed) {
                                        that.showSaveErrorDialog(errors);
                                        that.getView().byId("idSettingsForm").setBusy(false);
                                    }
                                }
                            });
                        }
                    });
                });

                if (started > 0) {
                    this.enableSaveButton(false);
                    this.getView().byId("idSettingsForm").setBusy(true);
                }
            },
            showSaveSuccessDialog: function () {
                this.showDialog('Success', 'Your changes have been saved.');
            },
            showSaveErrorDialog: function (errorCount) {
                this.showDialog('Error', 'Not all changes could not be saved. There were ' + errorCount + ' errors.');
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