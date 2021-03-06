angular.module('quizApp')
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider
        .when('/', {
            templateUrl: "/quiz/view/plogin",
            controller: "LoginController",
            controllerAs: "login"
        })
        .when('/code/:code', {
            templateUrl: "/quiz/view/plogin",
            controller: "LoginController",
            controllerAs: "login"
        })
        .when('/app', {
            templateUrl: "/quiz/view/alogin",
            controller: "AppController",
            controllerAs: "login"
        })
        .when('/app/:code', {
            templateUrl: "/quiz/view/alogin",
            controller: "AppController",
            controllerAs: "login"
        })
        .when('/class', {
            templateUrl: "/quiz/view/plogin",
            controller: "LoginController",
            controllerAs: "login"
        })
        .when('/list', {
            templateUrl: "/quiz/view/studentCategoryList",
            controller: "QuizzesController",
            controllerAs: "quizzes"
        })
        .when('/list/:code', {
            templateUrl: "/quiz/view/studentCategoryList",
            controller: "QuizzesController",
            controllerAs: "quizzes"
        })
        .when('/public', {
            templateUrl: "/quiz/view/studentCategoryList",
            controller: "PublicController",
            controllerAs: "quizzes"
        })
        .when('/stats', {
            templateUrl: "/quiz/view/stats",
            controller: "StatsController",
            controllerAs: "stats"
        })
        .when('/play/:catId/:id', {
            templateUrl: "/quiz/view/intro",
            controller: "GameController",
            controllerAs: "quiz"
        })
        .when('/quiz/:catId/:quizId/question/:questionId', {
            templateUrl: "/quiz/view/question",
            controller: "QuestionController",
            controllerAs: "quiz"
        })
        .when('/quiz/:catId/:quizId/answer/:questionId', {
            templateUrl: "/quiz/view/answer",
            controller: "AnswerController",
            controllerAs: "quiz"
        })
        .when('/quiz/:catId/:quizId/complete', {
            templateUrl: "/quiz/view/complete",
            controller: "CompleteController",
            controllerAs: "quiz"
        })
        .when('/preview/:profileId/:id', {
            templateUrl: "/quiz/view/intro",
            controller: "PreviewController",
            controllerAs: "quiz"
        })
        .otherwise({redirectTo: '/'});
}]);
