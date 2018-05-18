sap.ui.define([ "sap/ui/core/Element"],
    /**
     * Frame
     * @param {sap.ui.core.Element} Element UI5 Base Element
     * @returns {*} Frame frame
     */
    function (Element) {
        'use strict';
        return Element.extend("sap.fiori.cri.control.Frame",{
            metadata: {
                properties: {
                    "top" : {type: "float", group: "Misc", defaultValue: 1.0},
                    "left" : {type: "float", group: "Misc", defaultValue: 1.0},
                    "bottom" : {type: "float", group: "Misc", defaultValue: 1.0},
                    "right" : {type: "float", group: "Misc", defaultValue: 1.0}
                }
            }
        });
    }
);
