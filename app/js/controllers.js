'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
   .controller('HomeCtrl', ['$scope', 'syncData','firebaseRef', function($scope, syncData, firebaseRef) {
        $scope.events = syncData('events');

        $scope.numEvents = function(){
            var log = [];
            angular.forEach($scope.events, function(value, key){
                this.push(key + ': ' + typeof (value));
            }, log);
            console.dir(log);
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
                $scope.eventsOnServer.$add($scope.event);
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