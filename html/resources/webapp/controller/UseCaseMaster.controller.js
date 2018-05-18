//noinspection JSValidateJSDoc
sap.ui.define([
        "sap/fiori/cri/controller/BaseController",
        "sap/ui/core/UIComponent"
    ],
    /**
     * Settings Controller
     * @param {sap.fiori.cri.controller.BaseController} BaseController Controller
     * @param {sap.ui.core.UIComponent} UIComponent UIComponent
     * @returns {*} Admin Controller
     */
    function (BaseController, UIComponent) {
        "use strict";

        return BaseController.extend("sap.fiori.cri.controller.UseCaseMaster", {
            onBeforeRendering: function () {
                this.loadLabels("UseCaseMaster", "en-US");
            },
            changeUseCase: function (oEvent) {
                var useCaseId = oEvent.getSource().data("target");
                UIComponent.getRouterFor(this).navTo("useCaseSettings", {useCaseId: useCaseId});
            },
            backToAdmin: function (oEvent) {
                UIComponent.getRouterFor(this).navTo("applicationSettings");
            }
        });
    });