//TODO Put this somewhere sensible

var maxTime = 20000; //max time in ms
        var maxScore = 200;
        var minScore = 10;
        var gracePeriod = 2000;

var randomise = function(array) {
        var currentIndex = array.length, temporaryValue, randomIndex ;
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

    return array;
};

angular.module('quizApp', ['ngRoute', 'ngAnimate']).
config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: "/quiz/view/index",
            controller: "StartController",
            controllerAs: "start"
            })
            .when('/list', {
                templateUrl: "/quiz/view/studentCategoryList",
                controller: "QuizzesController",
                controllerAs: "quizzes"
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
    }])
.config(['$logProvider', function($logProvider){
    $logProvider.debugEnabled(true);
}]);

angular.module('quizApp').run(function() {
    FastClick.attach(document.body);
});

angular.module('quizApp').factory('ZzishContent', ['$http', '$log', '$rootScope', function($http, $log, $rootScope){
    //Requires zzish.js to have been included
    if(typeof zzish == 'undefined') $log.error("Require zzish.js to use ZzishContent");

    var userId, code, currentActivityId;

    return {
        init: function(appId){
            zzish.init(appId);
        },
        user: function(id,name, code, callback){
            zzish.authUser(id, name, code, function(err, message){
                callback(err, message);
            });
        },
        validate: function(classCode){
            self.code = classCode.toLowerCase();
            return zzish.validateClassCode(classCode);
        },
        getPublicQuizzes: function(callback){
            if (self.userId==undefined || self.userId=="") {
                studentCode = localStorage.getItem("zname");
                self.userId = localStorage.getItem("zprofileId"+studentCode);
            }            
            if (self.userId==undefined|| self.userId=="") {
                //not a registered user so just create a new account
                self.userId = uuid.v4();   
            }
            zzish.listPublicContent(self.userId, function (err, message) {
                callback(err, message);
                $rootScope.$apply();
            });

        },
        register: function(profileId, classCode, callback){
            self.code = classCode.toLowerCase();
            self.userId = profileId;
            zzish.registerWithClass(profileId, classCode, function (err, message) {
                callback(err, message);
                $rootScope.$apply();
            });

        },
        login: function(studentCode, callback){
            if (self.userId==undefined) {
                studentCode = localStorage.getItem("zname");
                self.userId = localStorage.getItem("zprofileId"+studentCode);
            }
            if (self.code==undefined) {
                self.code = localStorage.getItem("zcode");
            }
            zzish.registerWithClass(self.userId, self.code, function (err, message) {
                callback(err, message);
                $rootScope.$apply();
            });
        },
        logout: function(userProfileId,callback){
            zzish.unauthUser(userProfileId, function (err, message) {
                localStorage.clear();
                self.userId = "";
                callback(err, message);
                $rootScope.$apply();
            });
        },        
        getConsumerContent: function(contentId, callback){
            zzish.getConsumerContent(self.userId, contentId, function (err, message) {
                callback(err, message);
                $rootScope.$apply();
            });            
        },
        startActivity: function(quiz, callback){
            var parameters = {
                activityDefinition: {
                    type: quiz.uuid,
                    name: quiz.name,
                    score: maxScore*quiz.questions.length,
                    count: quiz.questions.length,
                    duration: ""+ quiz.questions.length*maxTime,
                },       
                extensions: {
                    contentId: quiz.uuid,
                    groupCode: self.code
                }   
            }
            zzish.startActivityWithObjects(self.userId,parameters, function(err, message){
                $log.debug("Start Activity response... saving id", message);
                currentActivityId = message.id;
                callback(err, message);
            });
	   },
        stopActivity: function(callback){
            zzish.stopActivity(currentActivityId, {}, function(err, message){
                if(typeof callback != 'undefined')
                    callback(err, message);
            });
        },
        saveAction: function(question, options){
            var uuid = question.uuid==undefined?question.question:question.uuid;
            var parameters = {
                definition: {
                    type: uuid,
                    name: question.question,
                    score: maxScore,
                    duration: maxTime,
                    response: question.answer
                },
                result: {
                    score: options.score,
                    count: options.attempts,
                    duration: options.duration,
                    response: options.response,
                    correct: options.correct
                },
                extensions: {}
            }
            if (question.topicId) {
                parameters.extensions["categoryId"] = question.topicId;
            }
            zzish.logActionWithObjects(currentActivityId, parameters);
        }
    };
}]);


angular.module('quizApp').factory('QuizData', ['$http', '$log', '$location', 'ZzishContent', function($http, $log, $location, ZzishContent){
    // setup/add helper methods...
    var quizzes = [];
    var categories = {};
    var topics = {};
    var classCode, studentCode, currentQuiz;
    var currentQuizData = {correct: 0,
            questionCount: 0, totalScore: 0, name: "", report: []};

    var userProfileId = "";

    var chooseKind = function(qId){
        var randomKind = function(){
            var kinds = ['scrambled'];
            return kinds[Math.floor(Math.random()*kinds.length)];
        };

        var isIntegerAnswer = function(ans){
            return !!ans.match(/^-?\d+$/);
        };

        var generateIntegerAlternatives = function(ans){
            var ai = parseInt(ans);
            return ["" + ai + 2, "" + ai - 2, "" + (ai - 1)];
        };

        if(typeof qId != 'undefined') {
            var question = currentQuiz.questions[qId];
	    if (!question) return randomKind();
	    var indexOfSpace = question.answer.indexOf(" ");
            //Always do multiple choice if alternatives
            if((question && !!question.alternatives) || indexOfSpace>=0)
                return 'multiple';

            //If integer do multiple choice (generate alternatives if not there already).
            if(question && isIntegerAnswer(question.answer)){
                if(!question.alternatives)
                    question.alternatives = generateIntegerAlternatives(question.answer);
                return 'multiple';
            }


            //If length 1 (and not alternatives) should always do scrambled... (as won't have alternatives)
            if(currentQuiz.questions.length == 1)
                return 'scrambled';

            //If the answer length is long then do multiple choice (shouldn't have to type/input)
            if(question && question.answer.length > 9){
                return 'multiple';
            }else{
                return randomKind();
            }
        }else{
            return randomKind();
        }
    };
    /**
     *
     * @param result An object with a code and array of contents (in this case quizzes)
     * @param isClassCode This will either be processing results with a class code (if the student has used student code)
     * or student code (if the student used a class code)..
     */
    var processQuizList = function(result, isClassCode){
        if(isClassCode){
            classCode = result.code;
        }else{
            studentCode = result.code;
        }
        quizzes = [];
        categories = {};
        topics = {};
        for (i in result.contents) {
            quiz = result.contents[i];
            var cuuid = "undefined";
            var category = { name: "Other" };
            if (quiz.categoryId!=undefined) {
                cuuid = quiz.categoryId;
                if (result.categories!=undefined) {
                    for (i in result.categories) {
                        if (result.categories[i].uuid==quiz.categoryId) {
                            category = result.categories[i];
                        }
                    }                    
                }
            }
            if (categories[cuuid]==undefined) {
                categories[cuuid] = { category: category, quizzes: []} ;
            }
            categories[cuuid].quizzes.push(quiz);        
            if (category.name=="") {
                category.homework = true;
            }
            if (category.homework) {
                category.name="Quizzes (" + categories[cuuid].quizzes.length + ")";
            }            
            quizzes.push(quiz);
        }
        for (i in result.categories) {
            topics[result.categories[i].uuid] = result.categories[i];
        }
        $log.debug("Have processed. Have quizzes:", quizzes, "classCode:", classCode, "studentCode:", studentCode, "Processed from:", result);
    };

    var calculateScore = function(correct, duration){
        //Something a bit like (below not clear... probably meant 20000 etc), will go with 100 as max... can obviously easily change this
        //P2:  Add 20 second timer and have max 200 points scored per
        // question =  max (  0.1*(min(2000-time_in_milis,0),  if(correct, 50,0)).
        // To do this ideally should have a "Next" button that comes up after answering
        // each question and a 3, 2, 1 countdown page before showing the next question.
        //

        if(correct){
            return Math.max(minScore, Math.min(Math.round((maxTime + gracePeriod - duration)/(maxTime/maxScore)), maxScore));
        }else{
            return 0;
        }
    };

    //return client data api
    return {
        login: function(newStudentCode, callback){
            ZzishContent.init(initToken);
            ZzishContent.login(newStudentCode, function(err, message){
                if(!err) {
                    processQuizList(message, true);
                }else{
                    $log.debug("Error with user login:", err);
                }
                callback(err, message);
            });
        },
        getPublicQuizzes: function(callback){
            ZzishContent.init(initToken);
            ZzishContent.getPublicQuizzes(function(err, message){
                if(!err) {
                    processQuizList(message, true);
                }else{
                    $log.debug("Error with user login:", err);
                }
                callback(err, message);
            });
        },
        logout: function(){
            classCode = undefined;
            studentCode = undefined;
            if (userProfileId=="") {
                studentName = localStorage.getItem("zname");
                userProfileId = localStorage.getItem("zprofileId"+studentName); 
            }
            ZzishContent.logout(userProfileId,function (err,message) {
                userProfileId = "";
                //TODO other logout things?
                localStorage.clear();
                $location.path("/");
            });
        },        
        validate: function(newClassCode) {
            return ZzishContent.validate(newClassCode);
        },
        register: function(studentName, newClassCode, callback) {            
            classCode = newClassCode.toLowerCase();
            ZzishContent.init(initToken);
            var userProfileId = localStorage.getItem("zprofileId"+studentName);
            if (userProfileId==undefined || userProfileId=="") {
                userProfileId = uuid.v4();
                localStorage.setItem("zprofileId"+studentName,userProfileId);
            }
            ZzishContent.user(userProfileId, studentName, classCode, function(err, message){                
                if(!err) {
                    userProfileId = message.uuid;
                    ZzishContent.register(userProfileId, classCode, function(err2, message2){
                        if(!err2 && err2!=404) processQuizList(message2, false);
                        callback(err2, message2);
                    });
                }else{
                    $log.debug("Error with user registration");
                    callback(err, message);
                }
            });
        },
        getQuizzes: function(){
            return quizzes;
        },
        getCategories: function(){
            return categories;
        },
        getTopics: function(){
            return topics;
        },
        selectQuiz: function(categoryId,quizId){
            var found = false;
            if (categories[categoryId]!=null) {
                var category = categories[categoryId];
                for (i in category.quizzes) {
                    var quiz = category.quizzes[i];
                    if (category.quizzes[i].uuid==quizId) {
                        found = true;
                        ZzishContent.getConsumerContent(quizId,function(err,message) {
                            $log.debug("Selected quiz", quiz,message);
                            currentQuiz = quiz;
                            currentQuiz.questions = message.questions;
                            currentQuizData.totalScore = 0;
                            currentQuizData.questionCount = currentQuiz.questions.length;
                            currentQuizData.correct = 0;
                            currentQuizData.name = quiz.name;
                            currentQuizData.report = [];
                            ZzishContent.startActivity(quiz, function(err, resp){
                                $log.debug("Got response from start activity:", resp);
                            });                                                    
                        })
                    }
                }
            }
            if (!found) {
                $log.error("Selecting an invalid quiz", "Have quizzes", categories);
            }
        },
        getQuestion: function(id, questionCallback){
            if(typeof currentQuiz != 'undefined') {
                if(id < currentQuiz.questions.length) {
                    questionCallback(currentQuiz.questions[id]);
                }else{
                    $log.debug("Quiz complete", "Getting question", id, "from", currentQuiz);
                    $location.path("/quiz/complete");
                    ZzishContent.stopActivity();
                }
            }else{
                $log.error("Trying to get quiz without having selected one");
                return null;
            }
        },
        chooseKind: function(qId){
            return chooseKind(qId);
        },
        getAlternatives: function(id){
            $log.debug("Generating Alternatives for ", id, "from", currentQuiz);

            if(currentQuiz.questions[id].alternatives){
                var options = [];
                options.push(currentQuiz.questions[id].answer);
                for(var i in currentQuiz.questions[id].alternatives){
                    var alt = currentQuiz.questions[id].alternatives[i];
		    if (alt!=undefined && alt.length>0)
                    	options.push(alt);
                }
                return randomise(options);

            }else{
                var answers = [];
                var correct = currentQuiz.questions[id].answer;

                for(var i in currentQuiz.questions){
                    var q = currentQuiz.questions[i];
                    if(q.answer != correct){
                        answers.push(q.answer);
                    }
                }
                var options = randomise(answers).slice(0,3);
                options.push(correct);
                return randomise(options);
            }
        },
        getStudentData: function(){
            if (classCode==undefined) {
                classCode = localStorage.getItem("zcode");
            }
            if (studentCode ==undefined) {
                studentCode =    localStorage.getItem("zname");
            }
            return {classCode: classCode, studentCode: studentCode};
        },
        currentQuizData: currentQuizData,
        answerQuestion: function(idx, response, answer, questionName, duration){
            $log.debug("Answer question", response, answer, duration);

            var question = currentQuiz.questions[idx];

            var correct = (response.toUpperCase().replace(/\s/g, "") == answer.toUpperCase().replace(/\s/g, ""));
            var score = calculateScore(correct, duration);

            ZzishContent.saveAction(question, {
                score: score, 
                correct: correct, 
                attempts: 1, 
                response: response, 
                duration: duration
            });

            if(correct) {
                currentQuizData.correct++;
                currentQuizData.totalScore += score;
            }

            var reportItem = {
                id: idx,
                question: questionName,
                response: response,
                answer: answer,
                correct: correct,
                score: score,
                roundedScore: Math.round(score),
                seconds: Math.ceil(duration/1000),
                topicId: question.topicId,
                duration: duration
            };

            currentQuizData.report.push(reportItem);
            $log.debug("Adding report item:", reportItem);

            $location.path("/quiz/answer/" + idx);
        }
    };
}]);


angular.module('quizApp').controller('StartController', ['QuizData', '$log', '$location','$rootScope', function(QuizData, $log, $location,$rootScope){
    var self = this;
    self.loading = false;
    self.errorMessage = "";
    self.studentName = "";
    self.classCode = "";
    self.studentCode = "";

    var reportError = function(issue){
        self.loading = false;
        self.errorMessage = issue;
    };

    self.startPublicQuiz = function(){
        console.log("Public Quiz");
        QuizData.getPublicQuizzes(function(err, res){
            $location.path("/list");
        });
    }

    self.startQuiz = function(){
        if(self.studentCode.length == 0){
            //Student name/class code login
            if(self.studentName.length == 0){
                self.errorMessage = "You must enter your name to start a quiz";
            } else if(self.classCode.length == 0){
                self.errorMessage = "You must enter a class code to start a quiz";
            } else {
                self.loading = true;
                if (QuizData.validate(self.classCode)) {
                    QuizData.register(self.studentName, self.classCode, function(err, res){
                        if(!err){
                            localStorage.setItem("zname",self.studentName);
                            localStorage.setItem("zcode",self.classCode);                            
                            $location.path("/list");
                        }else if (err==409){
                            reportError("Error. Chooose a different name as it seems someone else has recently used this name.");
                            $rootScope.$apply();
                        }
                        else {
                            reportError("Error. Please try entering your class code again")
                            $rootScope.$apply();
                        }
                    });                    
                }
                else {
                    reportError("Error. Please try entering your class code again");
                }
            }
        }else{
            self.loading = true;
            QuizData.login(self.studentCode, function(err, res){
                if(!err){
                    $location.path("/list");
                }else{
                    reportError("student code")
                }
           });
        }
    };

    if (localStorage.getItem("zname")!=undefined  && localStorage.getItem("zname")!=""
    && localStorage.getItem("zcode")!=undefined  && localStorage.getItem("zcode")!="") {
        self.classCode = localStorage.getItem("zcode");
        self.studentName = localStorage.getItem("zname");
        if (QuizData.validate(self.classCode)) {
            QuizData.register(self.studentName, self.classCode, function(err, res){
                if(!err){
                    $location.path("/list");
                }else {
                    localStorage.clear();
                }
            });                    
        }
        else {
            localStorage.clear();
        }        
    }
}]);


angular.module('quizApp').controller('QuizzesController', ['QuizData', '$log', '$location', '$timeout', function(QuizData, $log, $location, $timeout){
    var self = this;

    self.loading = true;

    self.startQuiz = function(categoryId,quizId){
        $log.debug("Selected Quiz: ", categoryId,quizId);
        QuizData.selectQuiz(categoryId,quizId);
        $location.path("/quiz/intro")
    };

    self.reloadQuizzes = function(){
        $log.debug("Reloading Quizzes");
        self.loading = true;

        $timeout(function(){
            self.reloadActive = true;
        }, 2000);

        QuizData.login(null,function(err, res){
            if(!err){
                self.quizzes = QuizData.getQuizzes();
                self.loading = false;
            }else{
                $log.error("Unable to refresh quizzes", err);
            }
       });
    };

    self.logout = function(){
        QuizData.logout();
    };

    self.studentData = QuizData.getStudentData();
    if (self.studentData.classCode==undefined) {
        self.categories = QuizData.getCategories();
    }
    else {
        QuizData.login(null,function(err, res){
            if(!err){
                self.quizzes = QuizData.getQuizzes();
                self.categories = QuizData.getCategories();
                self.loading = false;
            }else{
                $log.error("Unable to refresh quizzes", err);
            }
       });        
    }
}]);

angular.module('quizApp').controller('QuizController', ['QuizData', '$log', '$routeParams', '$location', function(QuizData, $log,  $routeParmas, $location){

    var startTime = (new Date()).getTime();

    var getLetters = function(answer){
        var letters = answer.toUpperCase().split('');
        letters.push('E');
        letters.push('T');
        letters.push('P');
        var letterSet = {};
        for(var idx in letters){
            letterSet[letters[idx]] = true;
        }
        var ls = [];
        for(var l in letterSet){
            ls.push(l);
        }
        return ls.sort();
    };

    var getUserAnswer = function(n){
        var ans = [];
        for(var i=0; i < n; i++){
            ans.push("_");
        }
        return ans;
    };

    var arrayMatch = function(a,b){
        if(a.length != b.length){
            return false;
        }
        for(var i=0; i< a.length; i++){
            if(a[i] != b[i]){
                return false;
            }
        }
        return true;
    };

    var replaceSpaces = function(s){
        return s.replace(/\s+/g, "_");
    };

    var self = this;

    self.questionId = parseInt($routeParmas.questionId);
    $log.debug("On question", self.questionId);

    self.score = QuizData.currentQuizData.totalScore;
    self.questionCount = QuizData.currentQuizData.questionCount;
    var lastEmpty = 0;

    QuizData.getQuestion(self.questionId, function(data){
        self.question = data.question;
        self.answer = replaceSpaces(data.answer);

        self.letters = getLetters(self.answer);
        self.answerLetters = self.answer.toUpperCase().split('');
        self.userAnswerLetters = getUserAnswer(self.answerLetters.length);

        lastEmpty = 0;
    });

    var updateLastEmpty = function(){
        for(var i=0; i < self.userAnswerLetters.length; i++){
            if(self.userAnswerLetters[i] == "_"){
                lastEmpty = i;
                return;
            }
            lastEmpty = self.userAnswerLetters.length;
        }
    };

    self.addLetter = function(idx){
        if(lastEmpty < self.answerLetters.length){
            self.userAnswerLetters[lastEmpty] = self.letters[idx];
            updateLastEmpty();
        }
    };

    self.removeLetter = function(idx){
        self.userAnswerLetters[idx] = "_";
        updateLastEmpty();
    };

    self.submit = function(){
        if(self.userAnswerLetters[self.userAnswerLetters.length - 1] != "_"){
            QuizData.answerQuestion(self.questionId,
                                self.userAnswerLetters.join("").toUpperCase(),
                                self.answer.toUpperCase(),
                                self.question,
                                (new Date()).getTime() - startTime
            );
        }else{
            //Must give full answer...
        }
    };

    $log.debug("Quiz Controller", self);

}]);


angular.module('quizApp').controller('MultipleController', ['QuizData', '$log', '$routeParams', '$location', function(QuizData, $log,  $routeParmas, $location){
    var self = this;
    var startTime = (new Date()).getTime();

    self.questionId = parseInt($routeParmas.questionId);
    $log.debug("On question", self.questionId);

    self.score = QuizData.currentQuizData.totalScore;
    self.questionCount = QuizData.currentQuizData.questionCount;

    QuizData.getQuestion(self.questionId, function(data){
        self.question = data.question;
        self.answer = data.answer;
        self.alternatives = QuizData.getAlternatives(self.questionId);

        self.longMode = false;
        for(var i in self.alternatives){
            if(self.alternatives[i].length > 10){
                self.longMode = true;
            }
        }
    });

    self.select = function(idx){
        QuizData.answerQuestion(self.questionId,
                                self.alternatives[idx],
                                self.answer,
                                self.question,
                                (new Date()).getTime() - startTime);
    };

    $log.debug("Multiple Controller", self);
}]);


angular.module('quizApp').controller('ScrambledController', ['QuizData', '$log', '$routeParams', '$location', function(QuizData, $log,  $routeParmas, $location){
    var getLetters = function(answer){

        var letters = answer.toUpperCase().split('');
        // letters.push('C');
        // letters.push('R');
        // letters.push('E');
        return randomise(letters);
    };

    var getUserAnswer = function(n){
        var ans = [];
        for(var i=0; i < n; i++){
            ans.push("_");
        }
        return ans;
    };

    var arrayMatch = function(a,b){
        if(a.length != b.length){
            return false;
        }
        for(var i=0; i< a.length; i++){
            if(a[i] != b[i]){
                return false;
            }
        }
        return true;
    };

    var replaceSpaces = function(s){
        return s.replace(/\s+/g, "_");
    };

    var self = this;
    var startTime = (new Date()).getTime();

    self.questionId = parseInt($routeParmas.questionId);
    $log.debug("On question", self.questionId);

    self.score = QuizData.currentQuizData.totalScore;
    self.questionCount = QuizData.currentQuizData.questionCount;

    var lastEmpty;

    QuizData.getQuestion(self.questionId, function(data){
        self.question = data.question;
        self.answer = replaceSpaces(data.answer);

        self.letters = getLetters(self.answer);
        self.answerLetters = self.answer.toUpperCase().split('');
        self.userAnswerLetters = getUserAnswer(self.answerLetters.length);

        lastEmpty = 0;
    });

    var updateLastEmpty = function(){
        for(var i=0; i < self.userAnswerLetters.length; i++){
            if(self.userAnswerLetters[i] == "_"){
                lastEmpty = i;
                return;
            }
            lastEmpty = self.userAnswerLetters.length;
        }
    };

    self.addLetter = function(idx){
        if(lastEmpty < self.answerLetters.length){
            self.userAnswerLetters[lastEmpty] = self.letters[idx];
            self.letters.splice(idx,1);
            updateLastEmpty();
        }

        if(lastEmpty == self.userAnswerLetters.length){
            QuizData.answerQuestion(self.questionId,
                                self.userAnswerLetters.join("").toUpperCase(),
                                self.answer.toUpperCase(),
                                self.question,
                                (new Date()).getTime() - startTime);
        }
    };

    self.removeLetter = function(idx){
        var letter = self.userAnswerLetters[idx];
        if(letter != "_") {
            self.letters.push(letter);
            self.userAnswerLetters[idx] = "_";
            updateLastEmpty();
        }
    };

    $log.debug("Scrambled Controller", self);
}]);


angular.module('quizApp').controller('ManualController', ['QuizData', '$log', '$routeParams', '$location', function(QuizData, $log,  $routeParmas, $location){
    var self = this;
    var startTime = (new Date()).getTime();

    self.questionId = parseInt($routeParmas.questionId);
    $log.debug("On question", self.questionId, "with quiz data", QuizData.currentQuizData);

    self.score = QuizData.currentQuizData.totalScore;
    self.questionCount = QuizData.currentQuizData.questionCount;

    self.yourAnswer = "";

    QuizData.getQuestion(self.questionId, function(data){
        self.question = data.question;
        self.answer = data.answer;
    });

    self.manualAnswer = function(){
        QuizData.answerQuestion(self.questionId, self.yourAnswer, self.answer, self.question,
                                (new Date()).getTime() - startTime);
    };

    $log.debug("Manual Controller", self);
}]);


angular.module('quizApp').controller('IntroController', ['QuizData', '$log', '$routeParams', '$location', function(QuizData, $log,  $routeParmas, $location){
    var self = this;

    self.name = QuizData.currentQuizData.name;

    self.start = function(){
        $location.path("/quiz/" +  QuizData.chooseKind(0) + "/0");
    };
}]);


angular.module('quizApp').controller('AnswerController', ['QuizData', '$log', '$routeParams', '$location', function(QuizData, $log,  $routeParmas, $location){
    var self = this;

    self.questionId = parseInt($routeParmas.questionId);

    self.data = QuizData.currentQuizData;
    self.studentData = QuizData.getStudentData();

    /* Have this data for previous question
                {id: idx,
                question: questionName,
                response: response,
                answer: answer,
                correct: correct}
     */

    self.last = self.data.report[self.data.report.length-1];

    self.nextQuestion = function(){
        var q = self.questionId + 1;
        $location.path("/quiz/" +  QuizData.chooseKind(q) + "/" + (q));
    }
}]);

angular.module('quizApp').controller('CompleteController', ['QuizData', '$log', '$location', function(QuizData, $log){
    var self = this;

    var calculateTotals = function(items){
        var t = {seconds: 0, score: 0};
        for(var j in items){
            var item = items[j];
            t.score += item.score;
            t.seconds += item.seconds;
            if (item.topicId!=undefined) {
                if (self.alltopics[item.topicId]!=undefined) {
                    if (self.alltopics[item.topicId].stats==undefined) {
                        if (self.alltopics[item.topicId].attainment==undefined) {
                            self.alltopics[item.topicId].attainment = {
                                'red': 0.1,
                                'amber': 0.4,
                                'green': 0.7,
                                'blue': 0.9
                            };
                        }
                        self.alltopics[item.topicId].stats = {
                            score: 0,
                            correct: 0,
                            answered: 0,
                            seconds: 0,
                            percentage: 0
                        }
                    }
                    self.alltopics[item.topicId].stats.score+=item.score;
                    self.alltopics[item.topicId].stats.seconds+=item.seconds;
                    if (item.correct!=undefined) {
                        self.alltopics[item.topicId].stats.correct+=(item.correct==true?1:0);    
                        self.alltopics[item.topicId].stats.answered++;
                        self.alltopics[item.topicId].stats.percentage = (self.alltopics[item.topicId].stats.correct/self.alltopics[item.topicId].stats.answered)*100;
                        if (self.alltopics[item.topicId].stats.percentage>=self.alltopics[item.topicId].attainment['blue']*100) {
                            self.alltopics[item.topicId].stats.state = 'b';
                        }
                        else if (self.alltopics[item.topicId].stats.percentage>=self.alltopics[item.topicId].attainment['green']*100) {
                            self.alltopics[item.topicId].stats.state = 'g';
                        }
                        else if (self.alltopics[item.topicId].stats.percentage>=self.alltopics[item.topicId].attainment['amber']*100) {
                            self.alltopics[item.topicId].stats.state = 'a';
                        }
                        else if (self.alltopics[item.topicId].stats.percentage>=self.alltopics[item.topicId].attainment['red']*100) {
                            self.alltopics[item.topicId].stats.state = 'r';
                        }
                    }
                }
            }
        }
        //only show topics for which we have data
        for (i in self.alltopics) {
            if (self.alltopics[i].stats!=undefined) {
                self.topics[i]=self.alltopics[i];
            }
        }
        t.score = Math.round(t.score);
        return t;
    };

    self.data = QuizData.currentQuizData;
    self.studentData = QuizData.getStudentData();
    self.topics = {};
    self.alltopics = QuizData.getTopics();

    self.totals = calculateTotals(QuizData.currentQuizData.report);

    $log.debug("Complete Controller", self);

    self.logout = function(){
        QuizData.logout();
    }
}]);

