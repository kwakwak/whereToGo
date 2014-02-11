'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
   .controller('HomeCtrl', ['$scope', 'syncData','$routeParams','$log','$location', function($scope, syncData,$routeParams,$log,$location) {

        if (typeof($routeParams.dd) == 'undefined'){
            var today = new Date();
            $scope.dd =  ('0' + (today.getDate())).slice(-2); //  adding leading zero 
            $scope.mm = ('0' + (today.getMonth()+1)).slice(-2); 
            $scope.yyyy = today.getFullYear();
        } else {
            $scope.dd = $routeParams.dd;
            $scope.mm = $routeParams.mm;
            $scope.yyyy = $routeParams.yyyy;
        }

        $scope.date = $scope.yyyy + "-" + $scope.mm + "-" + $scope.dd ; 
        $scope.eventsInDate = syncData('events').$child($scope.date);

        $scope.prevDate = new Date(); // set previous date of the currect date
        $scope.prevDate.setFullYear($scope.yyyy,($scope.mm-1),$scope.dd);
        $scope.prevDate.setDate($scope.prevDate.getDate()-1);

        var firstDate = new Date(); // set first date of events
        firstDate.setFullYear('2014','1','9');

        if (firstDate>$scope.prevDate){  // hide previous link if first date
          $scope.hidePrev=true;
        } else {
          $scope.hidePrev=false;
        }

        $scope.goToPrevDate = function(){
            var month = ('0' + ($scope.prevDate.getMonth()+1)).slice(-2); 
            var day = ('0' + ($scope.prevDate.getDate())).slice(-2); 
            $location.path('/'+$scope.prevDate.getFullYear()+'/'+month+'/'+day);
        };
   }])
  .controller('ChatCtrl', ['$scope', 'syncData', function($scope, syncData) {
      $scope.newMessage = null;

      // constrain number of messages by limit into syncData
      // add the array into $scope.messages
      $scope.messages = syncData('messages', 10);

      // add new messages to the list
      $scope.addMessage = function() {
         if( $scope.newMessage ) {
            $scope.messages.$add({text: $scope.newMessage});
            $scope.newMessage = null;
         }
      };
   }])

    .controller('admin', ['$scope', 'syncData','$log', function($scope, syncData,$log) {

        syncData(['users', $scope.auth.user.uid]).$bind($scope, 'user');

        $scope.resetEvent = function(){
            $scope.event = {
                title: null,
                details: null,
                date :null,
                place: null,
                type_selected: null,
                types: ['Show','Movie']
            };

            $scope.showSave = 0;
        };
        $scope.resetEvent();
        $scope.eventsOnServer = syncData('events');

        // add new messages to the list
        $scope.addEvent = function() {
            if( $scope.event.title ) {
                $scope.eventsOnServer.$child($scope.event.date).$add($scope.event);
                $scope.resetEvent();
            }
        };
        $scope.editEvent =function(id,action){
          $scope.selectedEvent = syncData('events/'+id);
            if (action =='del'){
                $scope.selectedEvent.$remove();
            } else if (action =='edit'){
                $scope.event= $scope.selectedEvent;
                $scope.showSave = 1;
            }
        };
        $scope.save = function(){
            $scope.event.$save();
            $scope.resetEvent();
        };
    }])


   .controller('LoginCtrl', ['$scope', 'loginService', '$location', function($scope, loginService, $location) {
      $scope.email = null;
      $scope.pass = null;
      $scope.confirm = null;
      $scope.createMode = false;


      $scope.login = function(cb) {
         $scope.err = null;
         if( !$scope.email ) {
            $scope.err = 'Please enter an email address';
         }
         else if( !$scope.pass ) {
            $scope.err = 'Please enter a password';
         }
         else {
            loginService.login($scope.email, $scope.pass, function(err, user) {
               $scope.err = err? err + '' : null;
               if( !err ) {
                  cb && cb(user);
               }
            });
         }
      };

      $scope.createAccount = function() {
         $scope.err = null;
         if( assertValidLoginAttempt() ) {
            loginService.createAccount($scope.email, $scope.pass, function(err, user) {
               if( err ) {
                  $scope.err = err? err + '' : null;
               }
               else {
                  // must be logged in before I can write to my profile
                  $scope.login(function() {
                     loginService.createProfile(user.uid, user.email);
                     $location.path('/account');
                  });
               }
            });
         }
      };

      function assertValidLoginAttempt() {
         if( !$scope.email ) {
            $scope.err = 'Please enter an email address';
         }
         else if( !$scope.pass ) {
            $scope.err = 'Please enter a password';
         }
         else if( $scope.pass !== $scope.confirm ) {
            $scope.err = 'Passwords do not match';
         }
         return !$scope.err;
      }
   }])

   .controller('AccountCtrl', ['$scope', 'loginService', 'syncData', '$location', function($scope, loginService, syncData, $location) {
      syncData(['users', $scope.auth.user.uid]).$bind($scope, 'user');

      $scope.logout = function() {
         loginService.logout();
      };

      $scope.oldpass = null;
      $scope.newpass = null;
      $scope.confirm = null;

      $scope.reset = function() {
         $scope.err = null;
         $scope.msg = null;
      };

      $scope.updatePassword = function() {
         $scope.reset();
         loginService.changePassword(buildPwdParms());
      };

      function buildPwdParms() {
         return {
            email: $scope.auth.user.email,
            oldpass: $scope.oldpass,
            newpass: $scope.newpass,
            confirm: $scope.confirm,
            callback: function(err) {
               if( err ) {
                  $scope.err = err;
               }
               else {
                  $scope.oldpass = null;
                  $scope.newpass = null;
                  $scope.confirm = null;
                  $scope.msg = 'Password updated!';
               }
            }
         }
      }

   }]);