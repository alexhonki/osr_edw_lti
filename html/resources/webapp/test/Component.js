if (sap.ushell.services.AppConfiguration.getCurrentAppliction().url.includes("sap/fiori/cri")){
    jQuery.sap.registerResourcePath('sap/fiori/cri', 'sap/fiori/cri');
}
sap.ui.define([
    "sap/ui/core/UIComponent"
], function (Component) {
    "use strict";
    return Component.extend("sap.fiori.cri.test.Component", {
        metadata : {
            manifest: "json"
        }
    });
});