var AppDispatcher       = require('createQuizApp/dispatcher/CQDispatcher');
var AppApi              = require('createQuizApp/actions/api/AppApi');
var AppConstants        = require('createQuizApp/constants/AppConstants');
var Promise             = require('es6-promise').Promise;
var uuid                = require('node-uuid');

var debounce            = require('createQuizApp/utils/debounce');

var AppActions = {

    loadApps: function(){
        AppApi.get()
            .then(function(apps){
                AppDispatcher.dispatch({
                    actionType: AppConstants.APP_LIST_LOADED,
                    payload: apps
                });
            });
    },

    loadApp: function(appId){
        AppApi.getInfo(appId)
            .then(function(appInfo){
                AppDispatcher.dispatch({
                    actionType: AppConstants.APP_INFO_LOADED,
                    payload: appInfo
                });
            });
    },

    deleteApp: function(app){
        AppApi.delete(app)
            .then(()=> this.loadApps() );
    },

    saveNewApp: function(app, appIcon){


        app.uuid = app.uuid || uuid.v4();

        var handleSave = function(icon){
            return new Promise(function(resolve, reject){

                if (icon) {
                    app.meta.iconURL = icon;
                }
                AppApi.putApp(app)
                    .then(function(){
                        AppDispatcher.dispatch({
                            actionType: AppConstants.APP_CREATED,
                            payload: app
                        });
                    })
                    .catch(reject);
            });
        };

        if (appIcon !== undefined){
            return new Promise((resolve, reject) => {
                this.appPicture(app.uuid, appIcon)
                    .then(function(response){
                        console.log('we got image uploaded?', response);
                        return handleSave(response);
                    })
                    .then(resolve)
                    .catch(reject);

                });
        } else {
            return handleSave();
        }
    },

    appPicture: function(appId, file){
        return AppApi.uploadMedia(appId, file);
    },

    searchPublicApps: debounce((searchString = '', categoryId) => {

        AppApi.searchApps(searchString, categoryId)
            .then(function(apps){

                AppDispatcher.dispatch({
                    actionType: AppConstants.APP_SEARCH_LOADED,
                    payload: apps
                });

            });
    }, 300)


};

module.exports = AppActions;