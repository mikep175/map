$(document).ready(function () {

    $("#btn-register").click(function () {

        var u = window.btoa($("#username").val());
        var p = window.btoa($("#password").val());

        var fullName = $("#fullname").val();
        var email = $("#email").val();

        var payload = { username: u, password: p, fullName: fullName, email: email };

        $.ajax({
            type: "POST",
            url: '/mapapp/register',
            data: JSON.stringify(payload),
            success: function () {

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
            
            
               },
            dataType: 'json'
        });

        return false;

    });


});