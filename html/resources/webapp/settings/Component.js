if (sap.ushell.services.AppConfiguration.getCurrentAppliction().url.includes("sap/fiori/cri")){
    jQuery.sap.registerResourcePath('sap/fiori/cri', '/sap/fiori/cri');
}
sap.ui.define([
    "sap/fiori/cri/component/BaseComponent",
    "sap/fiori/cri/controller/ModifyEventsDialog"
], function (BaseComponent, ModifyEventsDialog) {
    "use strict";
    return BaseComponent.extend("sap.fiori.cri.settings.Component", {
        metadata : {
            manifest: "json"
        },
        init : function () {
            BaseComponent.prototype.init.apply(this, arguments);
        },
        onBeforeRendering : function() {
            BaseComponent.prototype.onBeforeRendering.apply(this, arguments);

            this.setupUserAssistance("Settings");

            this.getRouter().initialize();

            this.modifyEventsDialog = new ModifyEventsDialog();
        }
    });
});