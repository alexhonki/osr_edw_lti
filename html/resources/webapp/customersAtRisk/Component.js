if (sap.ushell.services.AppConfiguration.getCurrentAppliction().url.indexOf("sap/fiori/cri") >= 0){
    jQuery.sap.registerResourcePath('sap/fiori/cri', '/sap/fiori/cri');
}
sap.ui.define([
    "sap/fiori/cri/component/BaseComponent",
    "sap/fiori/cri/controller/ExportDialog"
], function (BaseComponent, ExportDialog) {
    "use strict";
    return BaseComponent.extend("sap.fiori.cri.customersAtRisk.Component", {
        metadata : {
            manifest: "json"
        },
        init : function () {
            BaseComponent.prototype.init.apply(this, arguments);

            this.setupUserAssistance("CustomersAtRisk");

            this.exportDialog = new ExportDialog();
        }
    });
});