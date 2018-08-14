if (sap.ushell.services.AppConfiguration.getCurrentAppliction().url.indexOf("sap/fiori/cri") >= 0){
    jQuery.sap.registerResourcePath('sap/fiori/cri', 'sap/fiori/cri');
}
sap.ui.define([
    "sap/fiori/cri/component/BaseComponent",
    "sap/fiori/cri/controller/ModifyCustomersDialog",
    "sap/fiori/cri/controller/ModifyEventsDialog"
], function (BaseComponent, ModifyCustomersDialog, ModifyEventsDialog) {
    "use strict";
    return BaseComponent.extend("sap.fiori.cri.admin.Component", {
        metadata : {
            manifest: "json"
        },
        init : function () {
            BaseComponent.prototype.init.apply(this, arguments);
        },
        onBeforeRendering : function() {
            BaseComponent.prototype.onBeforeRendering.apply(this, arguments);

            this.setupUserAssistance("AdminSettings");

            this.getRouter().initialize();

            this.modifyCustomersDialog = new ModifyCustomersDialog();
            this.modifyEventsDialog = new ModifyEventsDialog();
        }
    });
});