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

        return BaseController.extend("sap.fiori.cri.controller.Admin", {
            onBeforeRendering: function () {
            },
            onNavigate: function (oEvent) {
                UIComponent.getRouterFor(this).navTo(oEvent.getSource().data("target"));
            }
        });
    });