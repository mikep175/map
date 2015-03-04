$(document).ready(function () {

    $("#btn-login").click(function () {

        var u = window.btoa($("#username").val());
        var p = window.btoa($("#password").val());

        $.ajax({
            type: "GET",
            url: '/mapapp/login',
            headers: {
                MapUserName: u,
                MapPassword: p
            },
            success: function (data) { window.location = '/lists.html'; ; },
            dataType: 'json'
        });

        return false;

    });


});