var fieldTypes = [{ text: "Textbox", value: "k-textbox" }, { text: "Date Picker", value: "k-datepicker" }, { text: "List of items", value: "static-list" }, { text: "Lookup list", value: "lookup-list"}];
var newField = null;


$(document).ready(function () {

    var fieldTypeDDL = $("#add-field-type").kendoDropDownList({ dataTextField: "text",
        dataValueField: "value",
        dataSource: { data: fieldTypes },
        change: function (e) {

            var val = e.sender.value();

            $(".fieldtype-options").hide();

            $("#" + val).show();

        }
    }).data('kendoDropDownList');

    collectionDDL = $("#lookup-collections").kendoDropDownList({ dataTextField: "name",
        dataValueField: "name",
        dataSource: { data: collectionList },
        change: function (e) {

            fieldsDDL.dataSource.data([]);
            fieldsDDL.value('');
            fieldsDDL.text('');

        }
    }).data('kendoDropDownList');

    var fieldsDDL = $("#lookup-fields").kendoDropDownList({
        autoBind: false,
   //     cascadeFrom: "lookup-collections",
        optionLabel: "Select field...",
        dataTextField: "title",
        dataValueField: "property",
        dataSource: {
            transport: {
                read: function (options) {

                    $.ajax({
                        type: "POST",
                        url: '/mapdata/find/mapmeta',
                        data: JSON.stringify({ name: collectionDDL.value() }),
                        success: function (data) { options.success(data[0].fields); },
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
            }
        }
    }).data("kendoDropDownList");


    var addFieldWin = $("#add-field-win").kendoWindow({ title: "Add New Field to List", width: "400px", height: "350px", modal: true }).data('kendoWindow');

    $(document).on("click", ".add-new-field", function () {

        fieldTypeDDL.value('k-textbox');
        $("#add-field-label").val('');
        $("#add-field-name").val('');
        $(".fieldtype-options").hide();
        addFieldWin.center();
        addFieldWin.open();

        return false;

    });

    $("#add-field-btn").click(function () {

        newField = { property: $("#add-field-name").val().replace(/\W/g, ''), title: $("#add-field-label").val(), dataType: 'text', controlType: fieldTypeDDL.value() };

        if (newField.controlType == 'static-list') {

            var items = $("#static-list-options").val().split('\n');

            newField['staticList'] = items;

        } else if (newField.controlType == 'lookup-list') {

            newField['lookupList'] = collectionDDL.value();

            newField['lookupDisplayField'] = fieldsDDL.value();
        }


        currentMetaItem.fields.push(newField);
        addFieldWin.close();

        $.ajax({
            type: "PUT",
            url: '/mapdata/collections/mapmeta',
            data: JSON.stringify(currentMetaItem),
            success: function () { updateVisibleItems(); },
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

        return false;


    });

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

    $(document).on('click', ".update-item", function () {

        var mapId = $(this).attr('mapid');

        var observ = $(".item-details[mapid='" + mapId + "']").get(0)['mapobservable'];

        $.ajax({
            type: "PUT",
            url: '/mapdata/collections/' + currentCollection,
            data: JSON.stringify(observ.toJSON()),
            success: function () { },
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

        return false;


    });

    $(document).on('click', ".btn-item", function () {

        var mapId = $(this).attr('mapid');

        var container = $(".item-details[mapid='" + mapId + "']");

        if (container.children().length == 0) {

            var details = $("<ul></ul>");

            container.append(details);

            var viewModel = kendo.observable(container.get(0)['mapitem']);

            for (var i = 0; i < currentMetaItem.fields.length; i++) {

                createControl(currentMetaItem.fields[i], details, viewModel);
            }

            container.append("<a href='#' class='btn btn-small update-item' mapid='" + mapId + "'>Save Item</a><a href='#' class='add-new-field' >Add New Field</a>");

            container.get(0)['mapobservable'] = viewModel;

            kendo.bind(details, viewModel);
        }

        container.toggle();

        return false;

    });

});

function createControl(metaField, parent, viewModel) {

    var field = $("<li></li>");

    parent.append(field);

    field.append("<span class='field-label' >" + metaField.title + "</span>");

    switch (metaField.controlType) {

        case "k-textbox":
            field.append("<input type='text' data-bind='value: " + metaField.property + "' class='k-textbox' />");
            break;
        case "k-datepicker":
            field.append("<input type='date' data-role='datepicker' data-bind='value: " + metaField.property + "' />");
               if (viewModel[metaField.property] != null) {
                    viewModel.set(metaField.property, new Date(viewModel[metaField.property]));
                }
            break;
        case "static-list":
            var ddl = $('<select data-role="dropdownlist" data-option-label="Select item..." data-value-primitive="true"  data-value-field="value"  data-bind="value: ' + metaField.property + '" ></select>');

            if (metaField.staticList) {
                for (var i = 0; i < metaField.staticList.length; i++) {

                    var option = metaField.staticList[i];
                    ddl.append('<option value="' + option + '" >' + option + '</option>');

                }
            }

            field.append(ddl);

            break;
        case "lookup-list":

            var listKey = metaField.lookupList.replace(/\W/g, '');

            var ddl = $('<select data-role="dropdownlist" data-value-primitive="true" data-option-label="Select item..." data-text-field="' + metaField.lookupDisplayField + '" data-value-field="_id" data-source="' + listKey + '___' + metaField.lookupDisplayField + '"  data-bind="value: ' + metaField.property + '" ></select>');

            if (typeof window[listKey + '___' + metaField.lookupDisplayField] == 'undefined') {

                window[listKey + '___' + metaField.lookupDisplayField] = new kendo.data.DataSource();

                if (metaField.lookupList && metaField.lookupDisplayField) {
                    $.ajax({
                        type: "GET",
                        url: '/mapdata/collections/' + metaField.lookupList,
                        success: function (data) {

                            window[listKey + '___' + metaField.lookupDisplayField].data(data);

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
                }
            }

            field.append(ddl);

            break;
    }

    return field;

}

function updateVisibleItems() {

    $(".item-details").each(function () {

        kendo.unbind($(this));

        var viewModel = $(this).get(0)['mapobservable'];

        viewModel.set(newField.property, null);

        createControl(newField, $(this).find('ul'), viewModel);

        kendo.bind($(this), viewModel);


    });

}

var currentMetaItem = null;

function createListMetaItem(listName) {

    $.ajax({
        type: "POST",
        url: '/mapdata/collections/mapmeta',
        data: JSON.stringify({ name: listName, fields: [{ property: 'title', title: 'title', dataType: 'text', controlType: 'k-textbox'}] }),
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

var collectionList = [];
var collectionDDL = null;

function createLists(data) {

    collectionList = data;

    collectionDDL.dataSource.data(collectionList);    

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