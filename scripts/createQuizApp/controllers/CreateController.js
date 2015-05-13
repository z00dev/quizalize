angular.module('createQuizApp').controller('CreateController', ['QuizData', '$log', '$location', '$routeParams', '$timeout', function(QuizData, $log, $location, $routeParams, $timeout){
    var self = this;

    //for autocomplete    
    self.topics = [];
    self.topicList = [];

    //whether it's the first time you create a question
    self.firstTime = true;

    //fields on the page
    self.currentQuestion = 1;
    self.mode = "Create";


    self.id = $routeParams.id;
    if (self.id==undefined) $location.path("/");

    QuizData.getQuiz(self.id, true, function(quiz){
        self.quiz = quiz;
        if (self.quiz.questions!=undefined) {
            self.currentQuestion = self.quiz.questions.length+1;    
        }        
        self.currentQuiz = self.quiz.name;
        self.rootTopicId = quiz.categoryId;
        QuizData.getTopics(function(topics){
            if (topics) {
                for (var i in topics) {
                    if (topics[i].parentCategoryId==self.rootTopicId) {
                        self.topics.push(topics[i]);
                        self.topicList.push(topics[i].name);
                        if (self.topicList.length>0) {
                            $( "#topic" ).autocomplete({
                                source: self.topicList
                            });
                        }
                    }
                }
            }
        });
    });

    self.clearQuestions = function(){
        $('#question').val("");
        $('#question').val("");
        $("#questionId").val("");
        $('#answer').val("");
        $('#alt1').val("");
        $('#alt2').val("");
        $('#alt3').val("");

        $timeout(function(){
            angular.element('#question').trigger('focus');
        });


        for(var i=1; i<4; i++)
            self['alt' + i] = "";

        self.answerText = "";
    };

    self.nextFromAnswer = function(){
        self.focusAlt(1);
    };

    self.focusAlt = function(altIdx){
        $timeout(function(){
            $('#alt' + altIdx).focus();
        });
    };

    self.focusQuestion = function(){
      $('#question').focus();
    };

    self.focusAnswer = function(){
      $('#answer').focus();
    };

    self.focusTopic = function(){
      $('#topic').focus();
    };

    self.addQuestion = function() {
        var question = $('#question').val();
        var answer = $('#answer').val();
        var topic = $('#topic').val();
        var topicId="";
        var questionId = $("#questionId").val();
        if (topic!="") {
            var found = false;
            for (var i in self.topics) {
                if (self.topics[i].name==topic) {
                    topicId = self.topics[i].uuid;
                    found = true;
                }
            }
            if (!found) {
                self.topicList.push(topic);
                var topic_object = {
                    uuid: uuid.v4(),
                    name: topic,
                    newObject: true,
                    subContent: true,
                    parentCategoryId: self.rootTopicId
                }
                topicId = topic_object.uuid;
                self.topics.push(topic_object);
                $( "#topic" ).autocomplete({
                    source: self.topicList
                });
            }
        }
        if(question.length == 0) {
            alert("Please enter a question");
            self.focusQuestion();
            return;
        }

        if(answer.length == 0) {
            alert("Please enter an answer");
            self.focusAnswer();
            return;
        }
        var newAnswer = false;
        if (questionId=="") {
            questionId = uuid.v4();
            newAnswer = true;
        }
        var question_obj = {uuid: questionId , question: question, answer: answer};
        if (topicId!="") {
            question_obj['topicId'] = topicId;
        }
        if ($('#alt1').val()!="") {
            var alternatives = [$('#alt1').val(), $('#alt2').val(), $('#alt3').val()];
            question_obj['alternatives'] = alternatives;
        }
        var found = false;
        if (!newAnswer) {
            for (var i in self.quiz.questions) {
                if (self.quiz.questions[i].uuid!=undefined && self.quiz.questions[i].uuid==questionId) {
                    found = true;
                    self.quiz.questions[i] = question_obj;
                }
            }
            if (!found) {
                self.quiz.questions.push(question_obj);
            }
        }
        else {
            if (!self.quiz.questions) self.quiz.questions = [];
            self.quiz.questions.push(question_obj);
        }
        self.mode = "Create";
        if (self.quiz.questions.length==1 && self.firstTime) {
            self.firstTime = false;
            QuizData.showMessage("Congratulations!","Great! You've created your first question. It's been added to the list below. Go ahead and create a few more questions. Once you're done, click \"I'm finished\" to let your class take this quiz!");
        }
        self.currentQuestion = self.quiz.questions.length+1;
        self.clearQuestions();
        QuizData.saveQuiz(self.id, self.quiz, self.topics);
        $("#alt1").resize();
        $("#alt2").resize();
        $("#alt3").resize();
        $("#question").resize();
        $("#answer").resize();        
        $("#quizzes").show();             
        $('#questionsAnd').animate({"scrollTop": $('#questionsAnd')[0].scrollHeight}, "slow");
    };

    self.editQuestion = function(idx){
        var q = self.quiz.questions[idx];
        $('#question').val(q.question);
        $('#answer').val(q.answer);
        if (q.uuid==undefined) {
            q.uuid = uuid.v4();
        }
        $('#questionId').val(q.uuid);
        if (q.topicId) {
            for (var i in self.topics) {
                if (self.topics[i].uuid==q.topicId) {
                    $('#topic').val(self.topics[i].name);
                }
            }

        }
        if(q.alternatives){
            for(var i=1; i<4; i++)
                $('#alt' + i).val(q.alternatives[i-1]);
        }
        $('#question').focus();
        self.mode = "Edit";
        self.currentQuestion = idx+1;
        $("#alt1").resize();
        $("#alt2").resize();
        $("#alt3").resize();
        $("#question").resize();
        $("#answer").resize();
        //self.quiz.questions.splice(idx,1);
    };

    self.remove = function(idx){
        self.quiz.questions.splice(idx, 1);
    };

    self.finished = function(){
        var question = $('#question').val();
        var answer = $('#answer').val();
        if(question.length > 0 && answer.length > 0){
            self.addQuestion();
        }

        QuizData.saveQuiz(self.id, self.quiz, self.topics);
        $location.path("/published/" + self.id+"/p");
    };

    $log.debug(self);

}]);
