//noinspection JSValidateJSDoc
sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/fiori/cri/model/adminService",
        "sap/ui/model/json/JSONModel"
    ],
    /**
     * Settings Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.fiori.cri.model.adminService} adminService Admin Service
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @returns {*} Controller
     */
    function (BaseController, adminService, JSONModel) {
        "use strict";

        return BaseController.extend("sap.fiori.cri.controller.ApplicationData", {
            /**
             * Controller init
             */
            onInit: function () {
                var oJSONModel = new JSONModel({
                    ApplicationRetentionDays: 120,

                    AreaId: {
                        Settings: 0
                    }
                });
                this.getView().setModel(oJSONModel);
            },
            onBeforeRendering: function () {
                this.loadCurrentValues();
            },
            onAfterRendering: function () {

            },
            onSave: function () {
                var properties = this.getView().getModel();
                var model = this.getView().getModel("CRI");

                adminService.updateSetting(model, adminService.oBuckets.DataRetentionDays, properties.getProperty("/ApplicationRetentionDays"));
                adminService.enableValue(model, adminService.oBuckets.ReactionType, properties.getProperty("/SelectedReactionType"));
            },
            loadCurrentValues: function () {
                var properties = this.getView().getModel();
                var model = this.getView().getModel("CRI");

                adminService.readSetting(model, adminService.oBuckets.DataRetentionDays, function (value, defaultValue) {
                    properties.setProperty("/ApplicationRetentionDays", value);
                    properties.setProperty("/ApplicationRetentionDaysDefault", defaultValue);
                });

                adminService.readValues(model, adminService.oBuckets.ReactionType, function (values) {
                    properties.setProperty("/ReactionTypes", values);
                    values.forEach(function (d) {
                        if (d.enabled) {
                            properties.setProperty("/SelectedReactionType", d.key);
                        }
                    });
                });
            },
            onRestore: function (event) {
                var area = event.getSource().data("area");
                var properties = this.getView().getModel();
                var model = this.getView().getModel("CRI");

                if (area == properties.getProperty("/AreaId/Settings")) {
                    var retentionDays = properties.getProperty("/ApplicationRetentionDaysDefault");

                    properties.setProperty("/ApplicationRetentionDays", retentionDays);

                    adminService.updateSetting(model, adminService.oBuckets.DataRetentionDays, retentionDays);
                }
            }
        });
    });