angular.module('quizApp')
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider
        .when('/', {
            templateUrl: "/quiz/view/index",
            controller: "StartController",
            controllerAs: "start"
        })
        .when('/list', {
            templateUrl: "/quiz/view/studentCategoryList",
            controller: "QuizzesController",
            controllerAs: "quizzes"
        })
        .when('/public', {
            templateUrl: "/quiz/view/studentCategoryList",
            controller: "PublicController",
            controllerAs: "quizzes"
        })
        .when('/class', {
            templateUrl: "/quiz/view/plogin",
            controller: "LoginController",
            controllerAs: "login"
        })
        .when('/account/:command/:id', {
            templateUrl: "/quiz/view/paccount",
            controller: "AccountController",
            controllerAs: "account"
        })          
        .when('/play/:catId/:id', {
            templateUrl: "/quiz/view/intro",
            controller: "GameController",
            controllerAs: "quiz"
        })
        .when('/quiz/fixed/:questionId', {
            templateUrl: "/quiz/view/quiz",
            controller: "QuizController",
            controllerAs: "quiz"
        })
        .when('/quiz/multiple/:questionId', {
            templateUrl: "/quiz/view/multiple",
            controller: "MultipleController",
            controllerAs: "quiz"
        })
        .when('/quiz/scrambled/:questionId', {
            templateUrl: "/quiz/view/scrambled",
            controller: "ScrambledController",
            controllerAs: "quiz"
        })
        .when('/quiz/manual/:questionId', {
            templateUrl: "/quiz/view/manual",
            controller: "ManualController",
            controllerAs: "quiz"
        })
        .when('/quiz/answer/:questionId', {
            templateUrl: "/quiz/view/answer",
            controller: "AnswerController",
            controllerAs: "quiz"
        })
        .when('/quiz/intro', {
            templateUrl: "/quiz/view/intro",
            controller: "IntroController",
            controllerAs: "quiz"
        })
        .when('/quiz/complete' ,{
            templateUrl: "/quiz/view/complete",
            controller: "CompleteController",
            controllerAs: "quiz"
        })
        .otherwise({redirectTo: '/'})
}]);
