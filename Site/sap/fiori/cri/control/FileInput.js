sap.ui.define(["sap/ui/core/Control"],
    function (Control) {
        'use strict';
        /**
         * Provides a wrapper around HTML5 file input support
         *
         * @class
         * @public
         * @extends sap.ui.core.Control
         * @name sap.fiori.cri.control.FileInput
         */
        var FileInput = Control.extend("sap.fiori.cri.control.FileInput", /** @lends sap.fiori.cri.control.FileInput */ {
            metadata: {
                events: {
                    "fileChanged": {
                        file: {type: "object"}
                    }
                }
            },
            /**
             * OnAfterRendering
             */
            onAfterRendering: function () {
                if(Control.prototype.onAfterRendering) {
                    Control.prototype.onAfterRendering.apply(this, arguments);
                }

                var fileInput = document.getElementById(this.getId());
                fileInput.addEventListener('change', this.onChange.bind(this));
            },
            /**
             * Returns the file object from the input control
             * @returns {File}
             */
            getFileObject: function () {
                var fileInput = document.getElementById(this.getId());
                return fileInput.files[0];
            },
            /**
             * Clears the file input
             */
            reset: function () {
                document.getElementById(this.getId()).value = null;
            },
            /**
             * Renderer for the control
             * @param oRM
             * @param oControl
             */
            renderer: function (oRM, oControl) {
                oRM.write("<input");
                oRM.writeControlData(oControl);
                oRM.write("type='file'/>");
            },
            /**
             * File selection change event proxy to ui5
             */
            onChange: function () {
                var file = this.getFileObject();
                this.fireEvent('fileChanged', {
                    file: file
                });
            }
        });

         return FileInput;
    }
);
