const path = require('path');
module.exports = function(grunt) {
    // Project configuration.


    var defaultLangs = ["en"];

    var createFile = function (lang) {
        return {
            expand: true,
            src: ['html/resources/webapp/i18n/i18n.properties'],
            rename: function () {
                return 'html/resources/webapp/i18n/i18n_' + lang + '.properties';
            },
            filter: function (filepath) {
                return !(grunt.file.exists('html/resources/webapp/i18n/i18n_' + lang + '.properties'));
            }
        };
    };

    var translationFiles = [];

    defaultLangs.forEach(function (lang) {
       translationFiles.push(createFile(lang));
    });

    grunt.initConfig({
        
        /*express: {
            devServer: {
                options: {
                    bases: 'www-root',
                    server: path.resolve(__dirname, 'localServer.js')
                }
            }
        },*/
        copy: {
            ui5Files: {
                files: [
                    //i18n
                    { expand: true, cwd: 'html/resources/webapp/', src: 'i18n/*', dest: 'html/resources/webapp/' },
                    // Mainfest files for UI5
                    { expand: true, cwd: 'html/resources/webapp/', src: '**/manifest.json', dest: 'html/resources/webapp/' },
                    // CSS Files
                    { expand: true, cwd: 'html/resources/webapp/', src: 'css/*.css', dest: 'html/resources/webapp/' },
                    // HTML5 App Descriptor for HCP
                    //{ expand: true, flatten: true, cwd: 'src', src: 'neo-app.json', dest: 'dist/' },
                    // TrendCardConfig
                    { expand: true, flatten: true, cwd: 'html/resources/webapp/trendAnalysis', src: 'trendCardConfig.json', dest: 'html/resources/webapp/trendAnalysis' }
                ]
            },
            create_i18n: {
                files: translationFiles
            },
            xsaDist: {
                files: [
                    { expand: true, cwd: 'dist', src: '**', dest: '/dist/' }
                ]
            }
        },
        openui5_preload: {
            component: {
                options: {
                    resources: {
                        cwd: 'html/resources/webapp/',
                        prefix: 'sap/fiori/cri'
                    },
                    dest: 'html/resources/webapp/'
                },
                components: {
                    'sap/fiori/cri/admin': {
                        src: [
                            'sap/fiori/cri/**'
                        ]
                    },
                    'sap/fiori/cri/customerDetails': {
                        src: [
                            'sap/fiori/cri/**'
                        ]
                    },
                    'sap/fiori/cri/customerPrediction': {
                        src: [
                            'sap/fiori/cri/**'
                        ]
                    },
                    'sap/fiori/cri/customersAtRisk': {
                        src: [
                            'sap/fiori/cri/**'
                        ]
                    },
                    'sap/fiori/cri/customerSearch': {
                        src: [
                            'sap/fiori/cri/**'
                        ]
                    },
                    'sap/fiori/cri/eventOverview': {
                        src: [
                            'sap/fiori/cri/**'
                        ]
                    },
                    'sap/fiori/cri/gettingStarted': {
                        src: [
                            'sap/fiori/cri/**'
                        ]
                    },
                    'sap/fiori/cri/search': {
                        src: [
                            'sap/fiori/cri/**'
                        ]
                    },
                    'sap/fiori/cri/superAdmin': {
                        src: [
                            'sap/fiori/cri/**'
                        ]
                    },
                    'sap/fiori/cri/trendAnalysis': {
                        src: [
                            'sap/fiori/cri/**'
                        ]
                    }
                }
            }

        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-openui5');
    //grunt.loadNpmTasks("gruntify-eslint");
    //grunt.loadNpmTasks('grunt-contrib-qunit');
    //grunt.loadNpmTasks('grunt-express');
    //grunt.registerTask("default", ["eslint"]);
    //grunt.registerTask("test", ["express", "eslint", "qunit"]);
    //grunt.registerTask("start", ["express", "express-keepalive"]);
    grunt.registerTask("build", ["openui5_preload", "copy:ui5Files", "copy:create_i18n"]);
    //grunt.registerTask("build_xsa", ["build", "copy:xsaDist"]);
};