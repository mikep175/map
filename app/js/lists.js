$(document).ready(function () {

    getLists();

    $("#btn-add-list").click(function () {

        $("#new-list-holder").show();

        $(this).hide();

        return false;

    });

    $("#btn-save-list").click(function () {

        var listName = encodeURIComponent($("#txt-new-listname").val());

        $.ajax({
            type: "POST",
            url: '/mapdata/collections',
            data: JSON.stringify({ name: listName }),
            success: function () {

                createListMetaItem(listName);

            },
            error: function (jqXHR, exception) {
                if (jqXHR.status == 401) {
                    window.location = '/login.html';
                }
            },
            headers: {
                MapAuth: getCookie('MapTicket')
            },
            dataType: 'json'
        });

        $("#txt-new-listname").val('');
        $("#new-list-holder").hide();
        $("#btn-add-list").show();
        return false;

    });

    $("#btn-add-item").click(function () {

        $("#new-item-holder").show();

        $(this).hide();

        return false;

    });

    $("#btn-save-item").click(function () {

        $.ajax({
            type: "POST",
            url: '/mapdata/collections/' + currentCollection,
            data: JSON.stringify({ title: $("#txt-new-itemtitle").val() }),
            success: function () { getListItems(currentCollection); },
            error: function (jqXHR, exception) {
                if (jqXHR.status == 401) {
                    window.location = '/login.html';
                }
            },
            headers: {
                MapAuth: getCookie('MapTicket')
            },
            dataType: 'json'
        });

        $("#txt-new-itemtitle").val('');
        $("#new-item-holder").hide();
        $("#btn-add-item").show();
        return false;

    });

    $(document).on('click', ".btn-item", function () {

        var mapId = $(this).attr('mapid');

        var container = $(".item-details[mapid='" + mapId + "']");

        var details = $("<ul></ul>");


        for (var i = 0; i < currentMetaItem.fields.length; i++) {

            var metaField = currentMetaItem.fields[i];
            var field = $("<li></li>");
            field.append("<span class='field-label' >" + metaField.title + "</span>");

            switch (metaField.controlType) {

                case "k-textbox":
                    field.append("<input type='text' data-bind='value: " + metaField.title + "' class='k-textbox' />");
                    break;


            }
            details.append(field);
        }

        container.append(details);

        var viewModel = kendo.observable(container.get(0)['mapitem']);

        container.get(0)['mapitem'] = viewModel;

        kendo.bind(details, viewModel);

        container.show();

        return false;

    });

});

var currentMetaItem = null;

function createListMetaItem(listName) {

    $.ajax({
        type: "POST",
        url: '/mapdata/collections/mapmeta',
        data: JSON.stringify({ name: listName, fields: [{ title: 'title', dataType: 'text', controlType: 'k-textbox'}] }),
        success: function () { getLists(); },
        error: function (jqXHR, exception) {
            if (jqXHR.status == 401) {
                window.location = '/login.html';
            }
        },
        headers: {
            MapAuth: getCookie('MapTicket')
        },
        dataType: 'json'
    });

}

var currentCollection = null;

function getLists() {
    $.ajax({
        type: "GET",
        url: '/mapdata/collections',
        success: createLists,
        error: function (jqXHR, exception) {
            if (jqXHR.status == 401) {
                window.location = '/login.html';
            }
        },
        headers: {
            MapAuth: getCookie('MapTicket')
        },
        dataType: 'json'
    });

}

function createLists(data) {

    var lists = $("#lists");

    lists.empty();

    var template = kendo.template($("#listTemplate").html());

    for (var i = 0; i < data.length; i++) {

        if(data[i].name != 'mapmeta') {

            var result = template(data[i]);
            lists.append(result);
        }
    }

    $(".btn-list").click(function () {

        var listName = $(this).find(".btn-text").text();

        currentCollection = encodeURIComponent(listName);

        getListItems(currentCollection);

        getMetaItem(currentCollection);

        return false;

    });


}

function getMetaItem(listName) {

    $.ajax({
        type: "POST",
        url: '/mapdata/find/mapmeta',
        data: JSON.stringify({ name: listName }),
        success: function (data) { currentMetaItem = data[0]; },
        error: function (jqXHR, exception) {
            if (jqXHR.status == 401) {
                window.location = '/login.html';
            }
        },
        headers: {
            MapAuth: getCookie('MapTicket')
        },
        dataType: 'json'
    });

}

function getListItems(listName) {

    $.ajax({
        type: "GET",
        url: '/mapdata/collections/' + listName,
        success: createListItems,
        error: function (jqXHR, exception) {
            if (jqXHR.status == 401) {
                window.location = '/login.html';
            }
        },
        headers: {
            MapAuth: getCookie('MapTicket')
        },
        dataType: 'json'
    });


}

function createListItems(data) {

    var listitems = $("#listitems");

    listitems.empty();

    if (data) {
        var template = kendo.template($("#listItemTemplate").html());

        for (var i = 0; i < data.length; i++) {

            var result = template(data[i]);

            listitems.append(result);

            $(".item-details[mapid='" + data[i]._id + "']").get(0)['mapitem'] = data[i];
        }
    }
    $("#lists-container").hide();
    $("#listitems-container").show();
}

function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}