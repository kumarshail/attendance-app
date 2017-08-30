
var pathArray = location.href.split('/')
switch (pathArray[pathArray.length - 1]) {
    case 'login_page.html':
        login_page();
        break;
    case 'signup_page.html':
        signup_page();
        break;
    case 'attendance_form.html':
        attendance_form();
        break;
    case 'attendance_list.html':
        attendance_list();
        break;
}

$(document).ready(function() {
    var $logout = $('#logout');
    $logout.on('click', function(event) {
        var common = commonService();
        common.removeLoginFromStorage(true);
        common.removeCurrentUser();
        common.goToPage('attendance');
    });
});

function commonService() {
    var common = {
        display: function(message) {
            alert(message);
        },
        goToPage: function(path) {
            location.pathname = path;
        },
        storeLoginToStorage: function(flag) {
            localStorage.setItem('userLoggedIn', flag);
        },
        getLoginFromStorage: function() {
            return localStorage.getItem('userLoggedIn');
        },
        removeLoginFromStorage: function() {
            localStorage.removeItem('userLoggedIn');
        },
        setCurrentUser: function(email) {
            localStorage.setItem('currentUser', email);
        },
        getCurrentUser: function() {
            return localStorage.getItem('currentUser');
        },
        removeCurrentUser: function() {
            localStorage.removeItem('currentUser');
        },
        handleUserLogin: function() {
            var common = commonService();
            if (!common.getLoginFromStorage()) {
                common.goToPage('attendance-app/login_page.html');
            }
        }
    }
    return common;
}

function httpService() {
    var baseUrl = 'https://daily-attendance.firebaseio.com/';
    var authToken = '.json?auth=kpoak2s2OJLSpF1TsFJxP4RRkFNUVCZ6aFJv7TEg'
    var getUrl = function(recordName) {
        return baseUrl + recordName + authToken;
    }
    var jsonString = function(data) {
        return JSON.stringify(data);
    }
    var jsonObj = function(response) {
        return JSON.parse(response);
    }
    var firebase = {
        get: function(recordName, queryParams = {}) {
            var defer = $.Deferred();
            $.ajax({
                url: getUrl(recordName),
                method: 'GET',
                dataType: 'json'
            }).done(function(response) {
                if (response) {
                    response = response;
                }
                console.log('======= GET Call Success======');
                console.log('====== Response: ', response);
                defer.resolve(response);
            });
            return defer.promise();
        },
        post: function(recordName, data) {
            var defer = $.Deferred();
            $.ajax({
                url: getUrl(recordName),
                method: 'POST',
                data: jsonString(data),
                dataType: 'json'
            }).done(function(response) {
                defer.resolve('Success!');
            })
            return defer.promise();
        }
    }
    return firebase;
}


function login_page() {
    $(document).ready(function () {
        var $loginBtn = $('#submit');
        $loginBtn.on('click', function(event) {
            event.preventDefault();
            var email = $('#email').val();
            var password = $('#password').val();
            login(email, password);
        })
    });

    function authenticateUser(data, email, password) {
        var common = commonService();
        var userNotFound = true;
        for (firebaseKey in data) {
            credentials = data[firebaseKey];
            if (credentials.email === email && credentials.password === password) {
                common.storeLoginToStorage(true);
                common.setCurrentUser(email);
                userNotFound = false;
                common.display('Success!');
                common.goToPage('attendance-app/attendance_form.html');
            }
        }
        if (userNotFound) {
            common.display('Invalid credentials');
        }
    }

    function login(email, password) {
        var http = httpService();
        $.when(http.get('users')).then(
            function(response) {
                authenticateUser(response, email, password);
            }
        )
    }
}

function signup_page() {
    $(document).ready(function() {
        var $signupBtn = $('#signup-btn');
        $signupBtn.on('click', function(event) {
            event.preventDefault();
            var email = $("#email").val();
            var password = $("#password").val();
            signup(email, password);
        })
    });

    function signup(email, password) {
        var http = httpService();
        $.when(http.post('users', {email: email, password: password})).then(
            function (response) {
                var common = commonService();
                common.display(response);
                common.goToPage('attendance-app/login_page.html');
            }
        )
    }
}


function attendance_form() {
    var common = commonService();
    common.handleUserLogin();
    $(document).ready(function() {
        var $submitBtn = $('#submit');
        $submitBtn.on('click', function(event){
            event.preventDefault();
            data = getDataForAttendace();
            saveAttendance(data);
        })
    });

    function getDataForAttendace() {
        var $date = $('#date').val();
        var $inTime = $('#in-time').val();
        var $outTime = $('#out-time').val();
        var currentUser = common.getCurrentUser();
        var data = {date: $date, inTime: $inTime, outTime: $outTime, user: currentUser};
        return data;
    }

    function saveAttendance(data) {
        var http = httpService();
        $.when(http.post('attendance', data)).then(
            function(response) {
                common.display(response);
                common.goToPage('attendance-app/attendance_list.html');
            }
        )
    }
}

function attendance_list() {
    var common = commonService();
    common.handleUserLogin();
    $(document).ready(function() {
        $('#attendance-list-heading').text("Attendance history of " + common.getCurrentUser());
        getList();
    });

    function showList(data) {
        var $attendanceDiv = $('#attendance-list');
        for (var firebaseKey in data) {
            var dataObj = data[firebaseKey];
            if (dataObj.user !== common.getCurrentUser()) {
                continue;
            }
            var htmlString = "<div class='table-responsive'><table class='table table-condensed'> \
                             <thead> <tr> <th> Email </th> <th> Date </th> <th> Entry Time </th> \
                             <th> Exit Time </th></tr></thead><tbody><tr><td>" + dataObj.user + "</td> \
                             <td>" + dataObj.date + "</td><td>" + dataObj.inTime + "</td><td> \
                             "+dataObj.outTime + "</td></tbody></table></div>";
            $attendanceDiv.append($(htmlString));
        }
    }

    function getList() {
        var http = httpService();
        $.when(http.get('attendance')).then(
            function(response) {
                showList(response);
            }
        )
    }
}

