//noinspection JSValidateJSDoc
jQuery.sap.require("sap.m.MessageBox");
sap.ui.define([
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/fiori/cri/service/ErrorService",
        "sap/m/MessageBox"
    ],
    /**
     * Settings Controller
     * @param {sap.ui.core.mvc.Controller} Controller Controller
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.fiori.cri.service.ErrorService"} ErrorService ErrorService
     * @param {sap.m.MessageBox} MessageBox MessageBox
     * @returns {*} Admin Controller
     */
    function (Controller, JSONModel, ErrorService, MessageBox) {
        "use strict";

        return Controller.extend("sap.fiori.cri.controller.PredefinedEventsEditorDialog", {
            _getDialog : function () {
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment("sap.fiori.cri.view.PredefinedEventsEditorDialog", this);
                    var model = new JSONModel();

                    model.setProperty("/Action", "Create");

                    this._oDialog.setModel(model);
                }
                return this._oDialog;
            },
            open : function (oView, oParams) {
                var oDialog = this._getDialog();
                if (oView.indexOfDependent(oDialog) == -1) {
                    oView.addDependent(oDialog);
                }
                oDialog.open();

                this.afterOpen();
            },
            afterOpen: function () {
                var criModel = this._oDialog.getModel("CRI");
                var model = this._oDialog.getModel();

                var templates = [];

                criModel.read("/PredefinedEventsTemplate", {
                    success: function (oData) {
                        try {
                            oData.results.forEach(function (d) {
                                var template = {
                                    TemplateId: d['TEMPLATE_ID'],
                                    TemplateName: d['EVENT_NAME'],
                                    Category: d['CATEGORY_NAME'],
                                    Description: d['DESCRIPTION'],
                                    Settings: []
                                };

                                if (d['PARAMETER1'] != null) {
                                    template.Settings.push({
                                        Parameter: d['PARAMETER_NAME_1'],
                                        Description: d['PARAMETER_DESCRIPTION_1'],
                                        Value: d['PARAMETER1'],
                                        Type: d['PARAMETER_TYPE_1']
                                    });
                                }

                                if (d['PARAMETER2'] != null) {
                                    template.Settings.push({
                                        Parameter: d['PARAMETER_NAME_2'],
                                        Description: d['PARAMETER_DESCRIPTION_2'],
                                        Value: d['PARAMETER2'],
                                        Type: d['PARAMETER_TYPE_2']
                                    });
                                }

                                if (d['PARAMETER3'] != null) {
                                    template.Settings.push({
                                        Parameter: d['PARAMETER_NAME_3'],
                                        Description: d['PARAMETER_DESCRIPTION_3'],
                                        Value: d['PARAMETER3'],
                                        Type: d['PARAMETER_TYPE_3']
                                    });
                                }

                                templates.push(template);
                            });

                            model.setProperty("/Templates", templates);
                            model.setProperty("/SelectedTemplate", templates[0]);
                        } catch (oError) {
                            ErrorService.raiseGenericError(oError);
                        }
                    },
                    error: function (oError) {
                        ErrorService.raiseGenericError(oError);
                    }
                });
            },
            onTemplateSelect: function (event) {
                var model = this._oDialog.getModel();
                var template = event.getParameters().selectedItem.getBindingContext().getObject();
                model.setProperty("/SelectedTemplate", template);
            },
            onSave: function () {
                var criModel = this._oDialog.getModel("CRI");
                var model = this._oDialog.getModel();

                var template = model.getProperty("/SelectedTemplate");

                var payload = {
                    ID: 0,
                    TEMPLATE_ID: template.TemplateId,
                    PARAMETER1: null,
                    PARAMETER2: null,
                    PARAMETER3: null
                };

                if (template.Settings[0] && template.Settings[0].Value != null) {
                    payload.PARAMETER1 = template.Settings[0].Value;
                }

                if (template.Settings[1] && template.Settings[1].Value != null) {
                    payload.PARAMETER2 = template.Settings[1].Value;
                }

                if (template.Settings[2] && template.Settings[2].Value != null) {
                    payload.PARAMETER3 = template.Settings[2].Value;
                }

                var that = this;

                criModel.create("/PredefinedEventsConfig", payload, {
                    success: function (e) {
                        MessageBox.success("Predefined event created successfully.", {
                            onClose: function () {
                                that._oDialog.setBusy(false);
                                that._oDialog.close();
                            }
                        });
                    },
                    error: function (e) {
                        MessageBox.error("Could not create new predefined event.");
                    }
                });
            },
            onCloseDialog : function () {
                this._getDialog().close();
            }
        });
    });