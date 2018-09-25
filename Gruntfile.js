const path = require('path');
module.exports = function(grunt) {
    // Project configuration.


    var defaultLangs = ["en"];

    var createFile = function (lang) {
        return {
            expand: true,
            src: ['Site/sap/fiori/cri/i18n/i18n.properties'],
            rename: function () {
                return 'Site/sap/fiori/cri/i18n/i18n_' + lang + '.properties';
            },
            filter: function (filepath) {
                return !(grunt.file.exists('Site/sap/fiori/cri/i18n/i18n_' + lang + '.properties'));
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
                    { expand: true, cwd: 'Site/sap/fiori/cri/', src: 'i18n/*', dest: 'Site/sap/fiori/cri/' },
                    // Mainfest files for UI5
                    { expand: true, cwd: 'Site/sap/fiori/cri/', src: '**/manifest.json', dest: 'Site/sap/fiori/cri/' },
                    // CSS Files
                    { expand: true, cwd: 'Site/sap/fiori/cri/', src: 'css/*.css', dest: 'Site/sap/fiori/cri/' },
                    // HTML5 App Descriptor for HCP
                    //{ expand: true, flatten: true, cwd: 'src', src: 'neo-app.json', dest: 'dist/' },
                    // TrendCardConfig
                    { expand: true, flatten: true, cwd: 'Site/sap/fiori/cri/trendAnalysis', src: 'trendCardConfig.json', dest: 'Site/sap/fiori/cri/trendAnalysis' }
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
                        cwd: 'Site/sap/fiori/cri/',
                        prefix: ''
                    },
                    dest: 'Site/sap/fiori/cri/'
                },
                components: {
                    'admin': {
                        src: [
                            '**'
                        ]
                    },
                    'customerDetails': {
                        src: [
                            '**'
                        ]
                    },
                    'customerPrediction': {
                        src: [
                            '**'
                        ]
                    },
                    'customersAtRisk': {
                        src: [
                            '**'
                        ]
                    },
                    'customerSearch': {
                        src: [
                            '**'
                        ]
                    },
                    'eventOverview': {
                        src: [
                            '**'
                        ]
                    },
                    'gettingStarted': {
                        src: [
                            '**'
                        ]
                    },
                    'search': {
                        src: [
                            '**'
                        ]
                    },
                    'superAdmin': {
                        src: [
                            '**'
                        ]
                    },
                    'trendAnalysis': {
                        src: [
                            '**'
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