//noinspection JSValidateJSDoc
sap.ui.define([
        "sap/ui/core/mvc/Controller"
    ],
    /**
     * Getting Started Controller
     * @param {sap.ui.core.mvc.Controller"} Controller Controller
     * @returns {*} Getting Started Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("sap.fiori.cri.controller.GettingStarted", {
            onAfterRendering:function () {
                this.getView().byId("idHtml").setContent(
                    '<iframe ' +
                    'width="100%" ' +
                    'height="100%" ' +
                    'src="https://www.youtube.com/embed/fJQMU9uD3Kw?showinfo=0&rel=0"' +
                    'frameborder="0" ' +
                    'allowfullscreen>' +
                    '</iframe>'
                );
            }
        });
    });