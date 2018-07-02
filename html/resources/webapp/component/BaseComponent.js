if (sap.ushell.services.AppConfiguration.getCurrentAppliction().url.indexOf("sap/fiori/cri") >= 0){
    jQuery.sap.registerResourcePath('sap/fiori/cri', '/sap/fiori/cri');
}
sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ushell/renderers/fiori2/RendererExtensions",
    "sap/fiori/cri/model/userAssistanceService",
    "sap/fiori/cri/service/FilterService"
], function (UIComponent, RendererExtensions, userAssistanceService, FilterService) {
    "use strict";
    return UIComponent.extend("sap.fiori.cri.component.BaseComponent", {
        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
        },
        exit: function () {
            if (this.videoButton) {
                RendererExtensions.removeOptionsActionSheetButton(this.videoButton, RendererExtensions.LaunchpadState.App);
            }

            if (this.helpHeadItem) {
                RendererExtensions.removeHeaderEndItem(this.helpHeadItem);
            }

            if (this.helpButton) {
                RendererExtensions.removeOptionsActionSheetButton(this.helpButton, RendererExtensions.LaunchpadState.App);
            }
        },
        setupUserAssistance: function (sContext) {
            var videoButton = new sap.m.Button();
            videoButton.setText("Getting Started Video");
            videoButton.setIcon("sap-icon://video");
            videoButton.attachEvent("press", function () {
                userAssistanceService.showUserAssistanceVideo(sContext);
            });

            this.videoButton = videoButton;

            // RendererExtensions.addOptionsActionSheetButton(videoButton,RendererExtensions.LaunchpadState.App);

            this.helpHeadItem = new sap.ui.unified.ShellHeadItem({
                tooltip: "Help",
                icon: sap.ui.core.IconPool.getIconURI("sys-help"),
                press: function () {
                    userAssistanceService.showUserAssistance(sContext);
                }
            });
            // RendererExtensions.addHeaderEndItem(this.helpHeadItem);

            var helpButton = new sap.m.Button();
            helpButton.setText("Help");
            helpButton.setIcon("sap-icon://sys-help");
            helpButton.attachEvent("press", function () {
                userAssistanceService.showUserAssistance(sContext);
            });
            this.helpButton = helpButton;

            // RendererExtensions.addOptionsActionSheetButton(helpButton,RendererExtensions.LaunchpadState.App);


        },
        dataSourceModelName:"CRI",
        filterEntityName:"FilterType",
        onBeforeRendering : function() {
            UIComponent.prototype.onBeforeRendering.apply(this, arguments);

            var oModel = this.getModel(this.dataSourceModelName);
            oModel.getMetaModel().loaded().then(function() {
                this.runAsOwner(function() {

                    var oMetaModel = oModel.getMetaModel();
                    var sEntityName = oMetaModel.getODataEntityContainer().namespace + "." + this.filterEntityName;
                    var oEntityType = oMetaModel.getODataEntityType(sEntityName, true);
                    var oMetadata = oMetaModel.createBindingContext(oEntityType);

                    if (oMetadata) {
                        var aFilterFields = this.extractFilterFields(oMetadata);
                        var oFilterRestrictions = this.extractFilterRestrictions(oMetadata);
                        var oFilterData = this.extractFilterData();

                        this.setFilterModel({
                            fields: aFilterFields,
                            data: oFilterData,
                            restrictions: oFilterRestrictions
                        });
                    }
                }.bind(this));
            }.bind(this));
        },
        extractFilterFields: function(oMetadata) {
            var aFilterFields = [];
            var aSelectionFields = oMetadata.getProperty("com.sap.vocabularies.UI.v1.SelectionFields");

            if (aSelectionFields && aSelectionFields.length) {
                for (var iFieldIndex = 0; iFieldIndex < aSelectionFields.length; iFieldIndex++) {
                    var oField = aSelectionFields[iFieldIndex];
                    if (oField.PropertyPath) {
                        var sFieldPath = (oField.PropertyPath).replace('/', '.');
                        aFilterFields.push(sFieldPath);
                    }
                }
            }

            return aFilterFields;
        },
        extractFilterRestrictions: function (oMetadata) {
            var oFilterRestrictions = {};
            var aRestrictions = oMetadata.getProperty("com.sap.vocabularies.Common.v1.FilterExpressionRestrictions");

            if (aRestrictions && aRestrictions.length) {
                for (var iRestrictionIndex = 0; iRestrictionIndex < aRestrictions.length; iRestrictionIndex++) {
                    var oRestriction = aRestrictions[iRestrictionIndex];

                    if (oRestriction.Property && oRestriction.Property.PropertyPath && oRestriction.AllowedExpressions && oRestriction.AllowedExpressions.EnumMember) {
                        var sPath = oRestriction.Property.PropertyPath;
                        var expression = oRestriction.AllowedExpressions.EnumMember;
                        if (this.endsWith(expression, "SingleValue")) {
                            oFilterRestrictions[sPath] = "single";
                        }
                    }
                }
            }
            return oFilterRestrictions;
        },
        extractFilterData: function () {
            var oFilterData = {};
            var oStartupParameters = FilterService.getFilterData();
            for (var sParameterKey in oStartupParameters) {
                if (!oStartupParameters.hasOwnProperty(sParameterKey)) { continue; }

                var oValue = oStartupParameters[sParameterKey];
                oFilterData[sParameterKey] = {
                    items: [{
                        key: oValue
                    }]
                };
            }

            /*
            var oComponentData = this.getComponentData();
            if (oComponentData && oComponentData.hasOwnProperty("startupParameters")) {
                var oStartupParameters = oComponentData["startupParameters"];

                for (var sParameterKey in oStartupParameters) {
                    if (!oStartupParameters.hasOwnProperty(sParameterKey)) { continue; }

                    var aParameters = oStartupParameters[sParameterKey];
                    if (aParameters && aParameters.length) {
                        var sKey = aParameters[0];
                        oFilterData[sParameterKey] = {
                            items: [{
                                key: sKey
                            }]
                        };
                    }
                }
            }
            */
            return oFilterData;
        },
        endsWith: function(sString, sSuffix) {
            return sString && sString.indexOf(sSuffix, sString.length - sSuffix.length) !== -1;
        },
        setFilterModel: function(oFilterModel) {
            this.setModel(new sap.ui.model.json.JSONModel(oFilterModel), "filter");
        },
        getFilterModel: function () {
            return this.getModel("filter");
        }
    });
});