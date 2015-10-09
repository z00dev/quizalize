var randomise = require('quizApp/utils/randomise');
var settings = require('quizApp/config/settings');
var QUIZ_CONTENT_TYPE = settings.QUIZ_CONTENT_TYPE;
var APP_CONTENT_TYPE = settings.APP_CONTENT_TYPE;

angular.module('quizApp').factory('QuizData', function($http, $log, $rootScope){

    if(typeof zzish === 'undefined') {
        $log.error("Require zzish.js to use zzish");
    }


    zzish.init(initToken);

    var userUuid = localStorage.getItem("uuid");
    var userName =  localStorage.getItem("userName");
    var gameCode = localStorage.getItem("gameCode");
    zzish.getUser(userUuid, userName);

    var classCode = localStorage.getItem("classCode");
    var categories = {};
    var topics = {};
    var currentQuiz = localStorage.getItem("currentQuiz") !== 'undefined' ?  JSON.parse(localStorage.getItem("currentQuiz")) : localStorage.removeItem('currentQuiz');

    var currentQuizResult = JSON.parse(localStorage.getItem("currentQuizResult"));

    var maxTime = settings.maxTime;
    var maxScore = settings.maxScore;
    var minScore = settings.minScore;
    var gracePeriod = settings.gracePeriod;

    var topicsLoaded = false;

    //callbacks for messaging
    var callbacks = {};

    var setUser = function(user) {
        if (user==undefined) {
            userUuid = "";
            localStorage.clear();
        }
        else {
            userUuid = user.uuid;
            userName = user.name;
            localStorage.setItem("uuid", userUuid);
            localStorage.setItem("userName", userName);
        }
    };

    var setClassCode = function(code) {
        classCode = code;
        localStorage.setItem("classCode",classCode);
    };

    var registerWithGroup = function(code,callback) {
        setClassCode(code);
        zzish.registerUserWithGroup(userUuid, classCode, function(err,resp) {
            if (!err) {
                processQuizData(resp,false);
            }
            callback(err, resp);
            $rootScope.$digest();
        });
    };

    var loadPlayerQuizzes = function(callback) {
        if (userUuid && classCode) {
            zzish.listContentForGroup(userUuid,classCode,function(err,resp) {
                if (!err) {
                    processQuizData(resp, false);
                }
                callback(err,resp);
                $rootScope.$digest();
            });
        }
    };

    var processQuizData = function(result, privateMode) {

        categories = {};
        topics = {};

        var allCategories = result.categories;

        if (result.pcategories) {
            allCategories = allCategories.concat(result.pcategories);
        }
        console.log('processing', result, allCategories);
        var getCategory = (categoryId) => {
            var category = allCategories.filter(c => c.uuid === categoryId)[0];
            return category;
        };

        for (var i in result.contents) {
            var quiz = result.contents[i];
            var cuuid = "undefined";
            var category = { name: "Other" };
            if (quiz.meta.categoryId !== undefined) {
                cuuid = quiz.meta.categoryId;
                var quizCategory = getCategory(cuuid);
                category = quizCategory ? quizCategory : category;
            }
            else {
                quiz.meta.categoryId = "unknown";
            }
            if (categories[cuuid] === undefined) {
                categories[cuuid] = { category: category, quizzes: [], order_index: parseInt(category.index || 0)} ;
            }
            if (privateMode) {
                //public quizzes
                quiz.publicAssigned = privateMode;
                if (quiz.meta && quiz.meta.live) {
                    categories[cuuid].quizzes.push(quiz);
                }
            }
            else {
                categories[cuuid].quizzes.push(quiz);
            }
        }

        for (var i in result.categories) {
            topicsLoaded = true;
            topics[result.categories[i].uuid] = result.categories[i];
        }
    };

    var processQuizCategories = function(result) {
        for (var i in result.categories) {
            var category = result.categories[i];
            // console.log("category", category);
            if (categories[category.uuid] === undefined) {
                categories[category.uuid] = { category: category, quizzes: [], order_index: parseInt(category.index)};
            }
        }
        for (var i in result.categories) {
            topicsLoaded = true;
            topics[result.categories[i].uuid] = result.categories[i];
        }
    };

    var getNumAlternvatives = function(currentQuestion) {
        var numAlternatives = 0;
        if (currentQuestion.alternatives) {
            for (var i in currentQuestion.alternatives) {
                if (currentQuestion.alternatives[i] && currentQuestion.alternatives[i] !== "") {
                    numAlternatives++;
                }
            }
        }
        return numAlternatives;
    };

    var selectAnswerType = function(currentQuestion, answerQuestion, questionIndex) {
        //we already have a question type (so don't update it)
        if (answerQuestion.type) return answerQuestion.type;
        var question = currentQuiz.payload.questions[questionIndex];
        var patternToDected = question.answer.match(/\$\$[\s\S]+?\$\$|\$[\s\S]+?\$/g);
        var length = question.answer.length;
        var numAlternatives = getNumAlternvatives(question);
        if(numAlternatives > 0 || patternToDected || length >= 20 || length === 1) {
            //either there are alternatives or there is a space in the anser
            return "multiple";
        }
        else {
            //var options = ["scrambled", "multiple"];
            //var ran = Math.floor(Math.random()*options.length);
            //return options[ran];
            return "scrambled";
        }
    };


    var initQuizResult = function() {
        currentQuizResult = { quizId: currentQuiz.uuid, totalScore: 0, questionCount: currentQuiz.payload.questions.length, report: [], correct: 0, latexEnabled: !!currentQuiz.latexEnabled };
        localStorage.setItem("currentQuizResult",JSON.stringify(currentQuizResult));
        return currentQuizResult;
    };

    var setQuiz = function(quiz) {
        currentQuiz = quiz;
        localStorage.setItem("currentQuiz",JSON.stringify(currentQuiz));
        if (quiz.payload && quiz.payload.questions) {
            quiz.payload.questions = spliceQuestions(quiz);
            initQuizResult();
        }
    };

    var searchThroughCategories = function(catId, quizId) {
        console.log('categories', categories, catId, quizId);
        for (var i in categories[catId].quizzes) {
            var quiz = categories[catId].quizzes[i];
            if (quiz.uuid == quizId) {
                setQuiz(quiz);
                return currentQuiz;
            }
        }
        for (var p in categories) {
            for (var i in categories[p].quizzes) {
                var quiz = categories[p].quizzes[i];
                if (quiz.uuid==quizId) {
                    setQuiz(quiz);
                    return currentQuiz;
                }
            }
        }
        return null;
    };

    var randomFunctionNumber = function(seed,size) {
        var x = Math.sin(seed++) * 10000;
        var result =  x - Math.floor(x);
        return Math.floor(result * size) + 1;
    };

    function shuffle(array) {
        if (array.length==1) {
            return array;
        }
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
    }

    var spliceQuestions = function(quiz) {
        var settings = quiz.meta;
        var result = [];
        if (quiz.payload!==undefined) {
            var questions = quiz.payload.questions;
            var seed = Math.floor((Math.random() * 100) + 1);
            if (settings && questions!=undefined && questions.length>1) {
                if (settings['random']==false) {
                    seed = quiz.meta.updated;
                }
                var result2 = [];
                if (settings['numQuestions']) {
                    try {
                        var num = parseInt(settings['numQuestions']);
                        var numToAdd = Math.min(num,questions.length);
                        for (var i=0;i<numToAdd;i++) {
                            var randomNumber = randomFunctionNumber(seed,questions.length);
                            var x = questions.splice(randomNumber,1);
                            result2.push(x[0]);
                        }
                    }
                    catch (err) {

                    }
                }
                else {
                    result2 = questions;
                }
                if (settings['random']==true) {
                    result = shuffle(result2);
                }
                else {
                    result = result2;
                }
            }
            else {
                return questions;
            }
        }
        return result;
    };

    var getPublicContent = function(quizId, callback) {
        zzish.getPublicContent(QUIZ_CONTENT_TYPE,quizId,function (err,message) {
            if (!err) {
                currentQuiz = message;
            }
            setQuiz(message);
            callback(err, message);
            $rootScope.$digest();
        });
    };


    var selectQuiz = function(type, quizId, callback) {
        if (type === "public") {
            getPublicContent(quizId, callback);
        }
        else {
            var quiz = searchThroughCategories(type, quizId);
            if (quiz.meta && quiz.meta.privacy === "public") {
                getPublicContent(quizId, callback);
            }
            else {
                zzish.getContent(quiz.meta.profileId, QUIZ_CONTENT_TYPE, quizId, function (err, result) {
                    setQuiz(result);
                    callback(err,result);
                    $rootScope.$digest();
                });
            }
        }
        // var quiz = null;
        // if (catId!="public") {
        //     if (categories[catId]==undefined) {
        //         loadPlayerQuizzes(function() {
        //             quiz = searchThroughCategories(catId,quizId);
        //             if (quiz!==null && quiz.payload!=null) {
        //                 callback(null,QuizFormat.process(quiz));
        //             }
        //         })
        //     }
        //     else {
        //         quiz = searchThroughCategories(catId,quizId);
        //         if (quiz!==null && quiz.payload!=null) {
        //             callback(null,QuizFormat.process(quiz));
        //         }
        //     }
        // }
        // else if (catId.indexOf("share:")==0) {
        //     zzish.getContent(catId.substring(6),QUIZ_CONTENT_TYPE,quizId,function (err,result) {
        //         setQuiz(result);
        //         callback(err,QuizFormat.process(result));
        //         $rootScope.$digest();
        //     });
        // }
        // if (quiz===null) {
        //     if (catId=="public") {
        //         getPublicContent(quizId,callback);
        //     }
        //     else {
        //         zzish.getContent(catId.substring(6),QUIZ_CONTENT_TYPE,quizId,function (err,result) {
        //             setQuiz(result);
        //             callback(err,QuizFormat.process(result));
        //             $rootScope.$digest();
        //         });
        //     }
        // }
        // else if (quiz.payload==null) {
        //     console.log("Loading quiz");
        //     zzish.getContent(catId,QUIZ_CONTENT_TYPE,quizId,function (err,result) {
        //         setQuiz(result);
        //         callback(err,QuizFormat.process(result));
        //         $rootScope.$digest();
        //     });
        // }

    };

    var calculateScore = function(correct, duration, questionDuration){
        // Something a bit like (below not clear... probably meant 20000 etc), will go with 100 as max... can obviously easily change this
        // P2:  Add 20 second timer and have max 200 points scored per
        // question =  max (  0.1*(min(2000-time_in_milis,0),  if(correct, 50,0)).
        // To do this ideally should have a "Next" button that comes up after answering
        // each question and a 3, 2, 1 countdown page before showing the next question.
        //
        var score;
        questionDuration = questionDuration * 1000;
        if (correct) {
            score = Math.max(minScore, Math.min(Math.round((questionDuration + gracePeriod - duration) / (questionDuration / maxScore)), maxScore));
        } else {
            score = 0;
        }
        return score;
    };

    var getAlternatives = function(answerObject, questionIndex){
        var question = currentQuiz.payload.questions[questionIndex];
        var numAlternatives = getNumAlternvatives(question);
        if(numAlternatives > 0){
            var options = [];
            options.push(answerObject.text);
            for(var i in question.alternatives) {
                var alt = question.alternatives[i];
                if (alt!=undefined && alt.length>0) {
                    options.push(alt);
                }
            }
            return randomise(options);
            //return options;
        } else {
            var answers = [];
            var correct = answerObject.text;

            for(var i in currentQuiz.payload.questions){
                var q = currentQuiz.payload.questions[i];
                if (q.question!=question.question) {
                    var answer = processInput(q.answer);
                    if(answer.text != correct){
                        answers.push(answer.text);
                    }
                }
            }
            var options = randomise(answers).slice(0,3);
            options.push(answerObject.text);
            return randomise(options);
        }
    };

    var processInput = function(input) {
        if (input) {
            if (input.indexOf("freetext://") === 0) {
                var meta = input.split("//");
                return {
                    type: "freetext",
                    text: meta[1]
                };
            }
            if (input.indexOf("scrambled://") === 0) {
                var meta = input.split("//");
                return {
                    type: "scrambled",
                    text: meta[1]
                };
            }
            if (input.indexOf("multiple://") === 0) {
                var meta = input.split("//");
                return {
                    type: "multiple",
                    text: meta[1]
                };
            }
            if (input.indexOf("freetext://") === 0) {
                var meta = input.split("//");
                return {
                    type: "freetext",
                    text: meta[1]
                };
            }
            if (input.indexOf("video://") === 0) {
                return {
                    type: "video",
                    url: "http://" + input.substring(8),
                    text: "Video"
                };
            }
            if (input.indexOf("videos://") === 0) {
                return {
                    type: "video",
                    url: "https://" + input.substring(9),
                    text: "Video"
                };
            }
            if (input.indexOf("audio://") === 0) {
                return {
                    type: "audio",
                    url: "http://" + input.substring(8),
                    text: "Audio"
                };
            }
            if (input.indexOf("audios://") === 0) {
                return {
                    type: "audio",
                    url: "http://" + input.substring(9),
                    text: "Audio"
                };
            }
            if (input.indexOf("exp:") === 0) {
                var meta = input.split("//");
                var commands = meta[0].split(":");
                return {
                    type: "text",
                    show: parseInt(commands[1]),
                    text: meta[1]
                };
            }
            if (input.indexOf("videoq:") === 0) {
                var meta = input.split("//");
                var commands = meta[0].split(":");
                var result = {
                    type: "videoq",
                    url: commands[1],
                    start: commands[2],
                    end: commands[3],
                    text: meta[1],
                    autoPlay: 0
                };
                if (commands.length == 5) {
                    result.autoPlay = parseInt(commands[4]);
                }
                return result;
            }
        }
        return {
            text: input
        };
    };

    //return client data api
    return {
        //User methods
        isLoggedIn: function() {
            return userUuid && userUuid.length>0 && classCode && classCode.length>0;
        },
        unsetUser: function() {
            var result = userUuid!="" && userUuid!=undefined;
            setUser(null);
            var token = localStorage.getItem("token");
            if (token!=null) {
                zzish.logout(token);
            }
            return result;
        },
        getUser: function () {
            return userUuid;
        },
        gameCode: function() {
            return gameCode;
        },
        resetGame: function() {
            gameCode = null;
            localStorage.removeItem("gameCode");
        },
        getUsername: function() {
            return userName;
        },
        getClassCode: function() {
            return classCode;
        },
        setUser: function (user) {
            setUser(user);
        },
        registerUserWithGroup: function(code,callback) {
            if (code!=undefined) {
                setClassCode(code);
                registerWithGroup(code,callback);
            }
            else {
                callback("No Code");
            }
            $rootScope.$digest();
        },
        getCategories: function() {
            return categories;
        },
        getTopics: function(callback,preview) {
            if (!topicsLoaded) {
                if (!!preview) {
                    callback([]);
                }
                else if (!classCode) {
                    zzish.listPublicContent(QUIZ_CONTENT_TYPE, function(err, data) {

                        if (!err) {
                            data.categories = data.pcategories.filter(c => c !== null).concat(data.categories.filter(c => c !== null));
                            data.contents = data.contents.filter(c => c !== null);
                            processQuizCategories(data);
                        }
                        callback(topics);
                        $rootScope.$digest();
                    });
                }
                else {
                    zzish.registerUserWithGroup(userUuid, classCode, function(err,resp) {
                        if (!err) {
                            processQuizData(resp,false);
                        }
                        callback(err, resp);
                        $rootScope.$digest();
                    });
                }
            }
            else {
                return callback(topics);
            }
        },
        logQuestion: function(question) {
            if (!currentQuizResult.processing) {
                currentQuizResult.processing = {};
            }
            if (!currentQuizResult.processing[question.uuid]) {
                currentQuizResult.processing[question.uuid] = {
                    startTime: Date.now()
                };
            }
            localStorage.setItem("currentQuizResult", JSON.stringify(currentQuizResult));
            return currentQuizResult.processing[question.uuid].startTime;
        },
        loginUser: function(user, classcode, callback) {
            if (zzish.validateClassCode(classcode)) {
                var newId = uuid.v4();
                zzish.authUser(newId,user,classcode,function(err,message) {
                    if (!err) {
                        setUser(message);
                        registerWithGroup(classcode,callback);
                    }
                    else {
                        callback(err,message);
                    }
                    $rootScope.$digest();
                });

            }
            else {
                callback(404,"Check your classcode");
            }
        },
        loadApp: function(code, callback) {
            gameCode = code;
            localStorage.setItem("gameCode",code);
            if (zzish.validateClassCode(code)) {
                zzish.getPublicContentByCode(APP_CONTENT_TYPE, code, function(err, result) {
                    if (!err) {
                        callback(null, result);
                    }
                    else {
                        callback(result.status, result.message);
                    }
                    $rootScope.$digest();
                });
            }
            else {
                callback(404,"Check your classcode");
            }
        },
        loadQuizzes: function(app, callback) {
            var quizzes = app.quizzes.split(",");
            if (quizzes.length == 1) {
                zzish.getPublicContent(QUIZ_CONTENT_TYPE,quizzes[0],function(err,message) {
                    zzish.listPublicContent(QUIZ_CONTENT_TYPE, function(err,result) {
                        result.contents = [message];
                        processQuizData(result,false);
                        callback(err,message);
                        $rootScope.$digest();
                    });
                });
            }
            else {
                zzish.getContents(app.profileId, QUIZ_CONTENT_TYPE, quizzes, function(err,message) {
                    zzish.listPublicContent(QUIZ_CONTENT_TYPE, function(err,result) {
                        result.contents = message;
                        processQuizData(result,false);
                        callback(err,message);
                        $rootScope.$digest();
                    });
                });
            }
        },
        loadPlayerQuizzes: function(callback) {
            loadPlayerQuizzes(callback);
        },
        loadPublicQuizzes: function(callback){
            zzish.listPublicContent(QUIZ_CONTENT_TYPE, function(err, message){
                if(!err) {
                    message.categories = message.categories.filter(c => c !== null);
                    message.contents = message.contents.filter(c => c !== null);

                    processQuizData(message, true);
                }
                callback(err, message);
                $rootScope.$digest();
            });
        },
        loadStats: function(callback){
            zzish.getUserResults(userUuid, {aggregate: true, data: true}, function(err, message) {
                callback(err, message);
                $rootScope.$digest();
            });
        },
        loadQuiz: function(catId,quizId,callback) {
            var cb = function(data){
                data.payload.questions.forEach(function(currentQuestion, questionIndex) {
                    currentQuestion.questionObject = processInput(currentQuestion.question);
                    currentQuestion.answerObject = processInput(currentQuestion.answer);
                    currentQuestion.expObject = processInput(currentQuestion.answerExplanation);
                    currentQuestion.answerObject.type = selectAnswerType(currentQuestion.questionObject, currentQuestion.answerObject, questionIndex);
                    if (currentQuestion.answerObject.type === "multiple") {
                        currentQuestion.questionObject.alternatives = getAlternatives(currentQuestion.answerObject, questionIndex);
                    }
                });
                callback(data);
            };
            if (currentQuiz!=undefined && currentQuiz.uuid==quizId) {
                cb(currentQuiz);
            }
            else {
                //we have a problem
                selectQuiz(catId, quizId, cb);
            }
        },
        selectQuiz: selectQuiz,
        previewQuiz: function(quizId, callback) {
            var uuid = localStorage.getItem('cqUuid');
            $http.get(`/create/${uuid}/quizzes/${quizId}`).then(function(response){
                console.log('we got quiz!', response.data);
                setQuiz(response.data);
                callback(response.data);
            });
            // var quizData = JSON.parse(localStorage.getItem("quizData"));
            // if (quizData !== undefined) {
            //     var quiz = quizData[quizId];
            //     setQuiz(quiz);
            //     callback(quiz);
            // }
            // else {
            //     console.error('No data found for quiz', quizId);
            // }
        },
        currentQuiz: function() {
            return currentQuiz;
        },
        startCurrentQuiz: function(callback) {
            var parameters = {
                activityDefinition: {
                    type: currentQuiz.uuid,
                    name: currentQuiz.name,
                    score: settings.maxScore * currentQuiz.payload.questions.length,
                    count: currentQuiz.payload.questions.length,
                    duration: ""+ currentQuiz.payload.questions.length * settings.maxTime,
                },
                extensions: {
                    contentId: currentQuiz.uuid,
                    groupCode: classCode
                }
            };
            if (currentQuiz.meta.categoryId) {
                parameters.extensions.categoryId = currentQuiz.meta.categoryId;
            }
            if (currentQuiz.publicAssigned==true && userUuid==null) {
                userUuid = uuid.v4();
            }
            if (currentQuizResult==null) {
                initQuizResult(currentQuiz);
            }
            currentQuizResult.currentActivityId = zzish.startActivityWithObjects(userUuid,parameters, function(err, message){
                if (callback!=undefined){
                    callback(err, message);
                    $rootScope.$digest();
                }
            });
        },
        currentQuizResult: function() {
            if (currentQuizResult.quizId==currentQuiz.uuid) {
                return currentQuizResult;
            }
            return initQuizResult(currentQuiz);
        },
        getQuestion: function(questionIndex,callback) {
            var currentQuestion = currentQuiz.payload.questions[questionIndex];
            callback(currentQuestion);
        },
        answerQuestion: function(idx, questionData, response, duration){
            var question = currentQuiz.payload.questions[idx];
            var questionDuration = question.duration || maxTime / 1000;
            console.log('currentQuiz,', currentQuiz);

            var correct = (response.toUpperCase().replace(/\s/g, "") == questionData.answerObject.text.toUpperCase().replace(/\s/g, ""));
            var score = calculateScore(correct, duration, questionDuration);
            var parameters = {
                definition: {
                    type: question.uuid,
                    name: question.questionObject.text,
                    score: maxScore,
                    duration: questionDuration,
                    response: question.answer
                },
                result: {
                    score: score,
                    correct: correct,
                    attempts: 1,
                    response: response,
                    duration: duration
                },
                extensions: {},
                attributes: {}
            };

            if (question.topicId) {
                parameters.extensions["categoryId"] = question.topicId;
            }
            if (question.imageURL) {
                parameters.attributes["image_url"] = question.imageURL;
            }
            if (questionData.expObject.text) {
                parameters.attributes["explanation"] = questionData.expObject.text;
            }
            if (question.latexEnabled == true) {
                parameters.attributes["latex"] = true;
            }

            if (currentQuizResult.currentActivityId !== undefined) {
                console.log('currentQuizResult.currentActivityId, parameters', currentQuizResult.currentActivityId, parameters);
                zzish.logActionWithObjects(currentQuizResult.currentActivityId, parameters);
            }

            if(correct) {
                currentQuizResult.correct++;
                currentQuizResult.totalScore += score;
            }

            var reportItem = {
                id: idx,
                question: questionData.questionObject,
                questionId: question.uuid,
                response: response,
                answer: questionData.answerObject.text,
                attempts: 1,
                correct: correct,
                score: score,
                latexEnabled: question.latexEnabled,
                roundedScore: Math.round(score),
                seconds: Math.ceil(duration/1000),
                topicId: question.topicId,
                duration: duration
            };
            var existingReport = currentQuizResult.report.filter(function(i) {
                return i.id == idx;
            });
            if (existingReport.length ==0) {
                currentQuizResult.report.push(reportItem);
            }
            else {
                existingReport[0].attempts++;
                existingReport[0].correct = reportItem.correct;
                existingReport[0].duration += reportItem.duration;
                existingReport[0].seconds += reportItem.seconds;
                existingReport[0].score = reportItem.score / existingReport[0].attempts;
                existingReport[0].roundedScore = Math.round(existingReport[0].score);
                existingReport[0].response = reportItem.response;
            }
            localStorage.setItem("currentQuizResult", JSON.stringify(currentQuizResult));
        },
        canShowQuestion: function(questionId) {
            if (currentQuizResult.report[questionId] === undefined) {
                return true;
            }
            var repeatUntilCorrect = true;
            //var repeatUntilCorrect = currentQuiz.meta.repeatlUntilCorrect === "true";
            if (repeatUntilCorrect) {
                return !currentQuizResult.report[questionId].correct;
            }
            return false;
        },
        generateNextQuestionUrl: function(questionId) {
            //var repeatUntilCorrect = true;
            var repeatUntilCorrect = currentQuiz.meta.repeatlUntilCorrect === "true";
            var nextQuestionId = -1;
            if (repeatUntilCorrect) {
                var tmpQ = questionId;
                while (true) {
                    tmpQ++;
                    if (tmpQ == currentQuiz.payload.questions.length) {
                        tmpQ = 0;
                    }
                    if (currentQuizResult.report[tmpQ] == undefined || (!currentQuizResult.report[tmpQ].correct && currentQuizResult.report[tmpQ].attempts < 3)) {
                        nextQuestionId = tmpQ;
                        break;
                    }
                    if (tmpQ == questionId) {
                        //we went through all the questions, so no more incorrect
                        nextQuestionId = -1;
                        break;
                    }
                }
            }
            else {
                if (currentQuiz.payload.questions.length != (questionId + 1)) {
                    nextQuestionId = questionId + 1;
                }
            }
            if (nextQuestionId !== -1) {
                return '/quiz/' +  currentQuiz.meta.categoryId + "/" + currentQuiz.uuid + "/question/" + (nextQuestionId);
            }
            else {
                if (currentQuizResult.currentActivityId !== undefined) {
                    zzish.stopActivity(currentQuizResult.currentActivityId, {});
                }
                return '/quiz/' +  currentQuiz.meta.categoryId + "/" + currentQuiz.uuid + "/complete";
            }
        },
        cancelCurrentQuiz: function(callback) {
            if (currentQuizResult.currentActivityId!=undefined) {
                zzish.cancelActivity(currentQuizResult.currentActivityId,function(err,message) {
                    initQuizResult();
                    if (callback!=undefined){
                        callback(err,message);
                        $rootScope.$digest();
                    }
                });
            }
        },
        showMessage : function(title, message, callBack) {
            if (callBack!=null) {
                var uuidGen = uuid.v4();
                $("#modalUuid").val(uuidGen);
                callbacks[uuidGen]=callBack;
            }
            else {
                $("#modalUuid").val("");
            }
            $("#modalTitle").html(title);
            $("#closeButton").hide();
            $("#modalMessage").html(message);
            $("#closeButton").html("OK");
            $("#messageButton").click();
        },
        confirmWithUser : function(title, message, callBack) {
            var uuidGen = uuid.v4();
            $("#modalUuid").val(uuidGen);
            callbacks[uuidGen]=callBack;
            $("#modalTitle").html(title);
            $("#closeButton").show();
            $("#modalMessage").html(message);
            $("#closeButton").html("No");
            $("#confirmButton").html("Yes");
            $("#messageButton").click();
        },
        confirmed: function(uuid) {
            if (uuid!=undefined && uuid!="" && callbacks[uuid]!=undefined) {
                var x = callbacks[uuid];
                delete callbacks[uuid];
                x();
            }
        }
    };
});
