// eslint-disable-next-line no-undef
angular.module('appRoutes', [])
  .config(['$routeProvider', '$locationProvider', ($routeProvider, $locationProvider) => {
    $routeProvider
      .when('/login1', {
        templateUrl: 'views/login1.html',
        controller: 'validateUser',
      })
      .when('/addUser', {
        templateUrl: 'views/addUser.html',
        controller: 'signupCtrl',
      })
      .when('/allUsers', {
        templateUrl: 'views/allUsers.html',
        controller: 'allUsersCtrl',
      })
      .when('/userEdit/:id', {
        templateUrl: 'views/editUser.html',
        controller: 'editUserCtrl',
      })
      .when('/home', {
        templateUrl: 'views/home.html',
        controller: 'showDetails',
      });

    $locationProvider.html5Mode(true);
  }]);
