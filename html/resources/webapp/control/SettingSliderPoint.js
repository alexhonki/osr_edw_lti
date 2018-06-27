sap.ui.define(["sap/ui/core/Element"],
    /**
     * Slider Point
     * @param {sap.ui.core.Element} Element UI5 Base Element
     * @returns {*} Slider Point
     */
    function (Element) {
        'use strict';
        return Element.extend("sap.fiori.cri.control.SettingSliderPoint",{
            metadata: {
                properties: {
                    "value" : {type: "float", group: "Misc", defaultValue: null},
                    "fillColor" : {type: "string", group: "Misc", defaultValue: null},
                    "segmentLabel" : {type: "string", group: "Misc", defaultValue: null},
                    "pointLabel" : {type: "string", group: "Misc", defaultValue: null}
                }
            }
        });
    }
);