var ERROR = 'ERROR';
var currentPropertyId = 'currentPropertyId';
var db = window.openDatabase('RentalZs', '1.0', 'RentalZs', 20000);

if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
    $(document).on('deviceready', onDeviceReady);
}
else {
    $(document).on('ready', onDeviceReady);
}

$(window).on('orientationchange', onOrientationChange);

// Page CREATE
$(document).on('pagebeforeshow', '#page-create', function () {
    prepareForm('#page-create #frm-register');
});

$(document).on('submit', '#page-create #frm-register', confirmProperty);
$(document).on('submit', '#page-create #frm-confirm', registerProperty);
// $(document).on('submit', '#page-creat #frm-register #file-image', chooseImage);
$(document).on('vclick', '#page-create #frm-confirm #edit', function () {
    $('#page-create #frm-confirm').popup('close');
});

$(document).on('change', '#page-create #frm-register #city', function () {
    importDistrict($('#page-create #frm-register #district'), this.value);
    importWard($('#page-create #frm-register #ward'), -1);
});

$(document).on('change', '#page-create #frm-register #district', function () {
    importWard($('#page-create #frm-register #ward'), this.value);
});

//PAGE SEARCH
$(document).on('pagebeforeshow', '#page-search', function () {
    prepareForm('#page-search #frm-search');
});

$(document).on('change', '#page-search #frm-search #city', function () {
    importDistrict($('#page-search #frm-search #district'), this.value);
    importWard($('#page-search #frm-register #ward'), -1);
});

$(document).on('change', '#page-search #frm-search #district', function () {
    importWard($('#page-search #frm-search #ward'), this.value);
});
$(document).on('submit', '#page-search #frm-search', search);
$(document).on('vclick', '#page-result #list-search-property li a', navigatePageDetail);
// Page LIST
$(document).on('pagebeforeshow', '#page-list', showList);

$(document).on('keyup', $('#page-list #txt-filter'), filterProperty);

$(document).on('vclick', '#page-list #list-property li a', navigatePageDetail);

// Page DETAIL
$(document).on('pagebeforeshow', '#page-detail', showDetail);

$(document).on('vclick', '#page-detail #btn-update', showUpdate);
$(document).on('vclick', '#page-detail #btn-delete-property', function () {
    changePopup($('#page-detail #setting'), $('#page-detail #frm-delete'));
});

$(document).on('vclick', '#page-detail #frm-update #cancel', function () {
    $('#page-detail #frm-update').popup('close');
});

$(document).on('submit', '#page-detail #frm-note', addNote);
$(document).on('submit', '#page-detail #frm-update', updateProperty);

$(document).on('submit', '#page-detail #frm-delete', deleteProperty);
$(document).on('keyup', '#page-detail #frm-delete #txt-confirm', confirmDelete);
$(document).on('vclick', '#page-detail #frm-delete #cancel-delete', cancelDelete);
$(document).on('change', '#page-detail #frm-update #city', function () {
    importDistrict($('#page-detail #frm-update #district'), this.value);
    importWard($('#page-detail #frm-update #ward'), -1);
});

$(document).on('change', '#page-detail #frm-update #district', function () {
    importWard($('#page-detail #frm-update #ward'), this.value);
});

function onDeviceReady() {
    log(`Device is ready.`);

    prepareDatabase(db);
}

function onOrientationChange(e) {
    if (e.orientation == 'portrait') {
        log('Portrait.');
    }
    else {
        log('Landscape.');
    }
}

function changePopup(sourcePopup, destinationPopup) {
    var afterClose = function () {
        destinationPopup.popup("open");
        sourcePopup.off("popupafterclose", afterClose);
    };

    sourcePopup.on("popupafterclose", afterClose);
    sourcePopup.popup("close");
}

function prepareForm(form) {
    importCityOption($(`${form} #city`), 'City');
    importDistrict($(`${form} #district`), -1);
    importWard($(`${form} #ward`), -1);

    selectOption($(`${form} #furniture`), Furniture, 'Furniture');
    selectOption($(`${form} #type`), Type, 'Type');
}

function importDistrict(select, selectedId, selectedValue = -1) {
    importCityOption(select, 'District', selectedValue, `WHERE CityId = ${selectedId}`);
}

function importWard(select, selectedId, selectedValue = -1) {
    importCityOption(select, 'Ward', selectedValue, `WHERE DistrictId = ${selectedId}`);
}

function importCityOption(select, name, selectedValue = -1, condition = '') {
    db.transaction(function (tx) {
        var query = `SELECT * FROM ${name} ${condition} ORDER BY Name`;
        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of ${name} successfully.`);

            var optionList = `<option value="-1">Select ${name}</option>`;

            for (let item of result.rows) {
                optionList += `<option value="${item.Id}" ${item.Id == selectedValue ? 'selected' : ''}>${item.Name}</option>`;
            }

            select.html(optionList);
            select.selectmenu('refresh', true);
        }
    });
}

function selectOption(select, list, name, selectedValue = -1) {
    var optionList = `<option value="-1">Select ${name}</option>`;

    for (var key in list) {
        optionList += `<option value="${list[key]}" ${list[key] == selectedValue ? 'selected' : ''}>${key}</option>`;
    }

    select.html(optionList);
    select.selectmenu('refresh', true);
}

function isValid(form) {
    var isValid = true;
    var error = $(`${form} #error`);

    error.empty();

    if ($(`${form} #city`).val() == -1) {
        isValid = false;
        error.append('<p>* City is required.</p>');
    }

    if ($(`${form} #district`).val() == -1) {
        isValid = false;
        error.append('<p>* District is required.</p>');
    }

    if ($(`${form} #ward`).val() == -1) {
        isValid = false;
        error.append('<p>* Ward is required.</p>');
    }

    if ($(`${form} #type`).val() == -1) {
        isValid = false;
        error.append('<p>* Type is required.</p>');
    }

    return isValid;
}
//CONFIRM PROPERTY
function confirmProperty(e,Note) {
    e.preventDefault();

    var name = $('#page-create #frm-register #name-property').val();
    var address = $('#page-create #frm-register #address-property').val();
    var city = $('#page-create #frm-register #city option:selected').text();
    var district = $('#page-create #frm-register #district option:selected').text();
    var ward = $('#page-create #frm-register #ward option:selected').text();
    var type = $('#page-create #frm-register #type option:selected').text();
    var furniture = $('#page-create #frm-register #furniture option:selected').text();
    var bedroom = $('#page-create #frm-register #bedroom').val();
    var price = $('#page-create #frm-register #price').val();
    var reporter = $('#page-create #frm-register #reporter-property').val();
    var date = $('#page-create #frm-register #date').val();
    var note = $('#page-create #frm-register #note').val();

    if (isValid('#page-create #frm-register')) {
    
        // var info = getFormInfoByName('#page-create #frm-register', true);
        
    
        db.transaction(function (tx) {
            var query = 'SELECT * FROM Property WHERE Name = ?';
            tx.executeSql(query, [name], transactionSuccess, transactionError);

            function transactionSuccess(tx, result) {
                if (result.rows[0] == null) {
                    log('Open the confirmation popup.');

                    $('#page-create #error').empty();

                    $('#page-create #frm-confirm #name-property').text(name);
                    $('#page-create #frm-confirm #address-property').text(address);
                    $('#page-create #frm-confirm #city').text(city);
                    $('#page-create #frm-confirm #district').text(district);
                    $('#page-create #frm-confirm #ward').text(ward);
                    $('#page-create #frm-confirm #type').text(type);
                    $('#page-create #frm-confirm #furniture').text(furniture);
                    $('#page-create #frm-confirm #bedroom').text(bedroom);
                    $('#page-create #frm-confirm #price').text(`${price.toLocaleString('en-US')} VNĐ / month`);
                    $('#page-create #frm-confirm #reporter-property').text(reporter);
                    $('#page-create #frm-confirm #date').text(date);
                    
                    $('#page-create #frm-confirm #note').text(note);

                    $('#page-create #frm-confirm').popup('open');
                }
                else {
                    var error = 'Name exists.';
                    $('#page-create #error').empty().append(error);
                    log(error, ERROR);
                }
            }
        });
    }
}
//REGISTER PROPERTY
function registerProperty(e) {
    e.preventDefault();

    // var info = getFormInfoByValue('#page-create #frm-register', true);
    var name = $('#page-create #frm-register #name-property').val();
    var address = $('#page-create #frm-register #address-property').val();
    var city = $('#page-create #frm-register #city').val();
    var district = $('#page-create #frm-register #district').val();
    var ward = $('#page-create #frm-register #ward').val();
    var type = $('#page-create #frm-register #type').val();
    var furniture = $('#page-create #frm-register #furniture').val();
    var bedroom = $('#page-create #frm-register #bedroom').val();
    var price = $('#page-create #frm-register #price').val();
    var reporter = $('#page-create #frm-register #reporter-property').val();
    var date = $('#page-create #frm-register #date').val();
    var note = $('#page-create #frm-register #note').val();


    db.transaction(function (tx) {
        var query = `INSERT INTO Property (Name, Street, City, District, Ward, Type, Bedroom, Price, Furniture, Reporter, DateAdded) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        tx.executeSql(query, [name, address, city, district, ward, type, bedroom, price, furniture, reporter, date], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Create a property '${name}' successfully.`);

            $('#page-create #frm-register').trigger('reset');
            $('#page-create #error').empty();
            $('#page-create #frm-register #name').focus();

            $('#page-create #frm-confirm').popup('close');

            if (note != '') {
                db.transaction(function (tx) {
                    var query = `INSERT INTO Note (Message, PropertyId, DateAdded) VALUES (?, ?, julianday('now'))`;
                    tx.executeSql(query, [note, result.insertId], transactionSuccess, transactionError);

                    function transactionSuccess(tx, result) {
                        log(`Add new note to property '${name}' successfully.`);
                    }
                });
            }

        }
       
    });
}

function showList() {
    db.transaction(function (tx) {
        var query = `SELECT Property.Id AS Id, Property.Name AS Name, Price, Bedroom,Furniture, Type, City.Name AS City
                     FROM Property LEFT JOIN City ON Property.City = City.Id`;

        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of properties successfully.`);
            
            var propertyList = `<ul id='list-property' data-role='listview' class='ui-nodisc-icon ui-alt-icon'>`;

            propertyList += result.rows.length == 0 ? '<li><h2>There is no property.</h2></li>' : '';
        
            for (let property of result.rows) {
                propertyList +=
                    `<li><a data-details='{"Id" : ${property.Id}}'>
                    
                    <h2 style='margin-bottom: 0px;'>${property.Name}</h2>
                    <p style='margin-top: 2px; margin-bottom: 10px;'><small>${property.City}</small></p>
                    <div>
                    <div style="float:left; margin-right: 10px;">
                        <img src='img/pearl-river-hotel-home1.jpg' width='150px' style="border-radius: 12px;">  
                    </div>
                    <div>
                                 
                        <img src='img/house.png' height='21px' style='margin-bottom: -5px;'>
                        <strong style='font-size: 13px;'>${Object.keys(Type)[property.Type]}<strong>
                        
                        &nbsp;&nbsp;

                        <img src='img/bedroom.png' height='20px' style='margin-bottom: -5px;'>
                        <strong style='font-size: 13px;'>${property.Bedroom}<strong>
                        
                        <br><br>

                        <img src='img/furnitures.png' height='21px' style='margin-bottom: -5px;'>
                        <strong style='font-size: 13px;'>${Object.keys(Furniture)[property.Furniture]}<strong>
                        
                        <br><br>
                           
                        <img src='img/money.png' height='20px' style='margin-bottom: -3px;'>
                        <strong style='font-size: 13px;'>${property.Price.toLocaleString('en-US')} VNĐ / month<strong>

                        
                    </div>
                    </div>
                </a></li>`;
            }
            propertyList += `</ul>`;
        
            $('#page-list #list-property').empty().append(propertyList).trigger('create');
        
            log(`Show list of properties successfully.`);
        }
    });
}

function navigatePageDetail(e) {
    e.preventDefault();

    var id = $(this).data('details').Id;
    localStorage.setItem(currentPropertyId, id);

    $.mobile.navigate('#page-detail', { transition: 'slide' });
}

function showDetail() {
    var id = localStorage.getItem(currentPropertyId);

    db.transaction(function (tx) {
        var query = `SELECT Property.*, datetime(Property.DateAdded) AS DateAddedConverted, City.Name AS CityName, District.Name AS DistrictName, Ward.Name AS WardName
        FROM Property
        LEFT JOIN City ON City.Id = Property.City
        LEFT JOIN District ON District.Id = Property.District
        LEFT JOIN Ward ON Ward.Id = Property.Ward
        WHERE Property.Id = ?`;
        // var query = 'SELECT * FROM Property WHERE Id = ?';

        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            if (result.rows[0] != null) {
                log(`Get details of property '${result.rows[0].Name}' successfully.`);

                var dataProperty = {
                    'Name': result.rows[0].Name,
                    'Street': result.rows[0].Street,
                    'City': result.rows[0].CityName,
                    'District': result.rows[0].DistrictName,
                    'Ward': result.rows[0].WardName,
                    'Type': Object.keys(Type)[result.rows[0].Type],
                    'Bedroom': result.rows[0].Bedroom,
                    'Price': result.rows[0].Price,
                    'Furniture': Object.keys(Furniture)[result.rows[0].Furniture],
                    'Reporter': result.rows[0].Reporter,
                    'DateAdded': result.rows[0].DateAddedConverted
                };

                $('#page-detail #detail #name').text(dataProperty.Name);
                $('#page-detail #detail #street ').text(dataProperty.Street);
                $('#page-detail #detail #city').text(dataProperty.City);
                $('#page-detail #detail #district').text(dataProperty.District);
                $('#page-detail #detail #ward').text(dataProperty.Ward);
                $('#page-detail #detail #type').text(dataProperty.Type);
                $('#page-detail #detail #furniture').text(dataProperty.Furniture);
                $('#page-detail #detail #bedroom').text(dataProperty.Bedroom);
                $('#page-detail #detail #price').text(`${dataProperty.Price.toLocaleString('en-US')} VNĐ / month`);
                $('#page-detail #detail #reporter').text(dataProperty.Reporter);
                $('#page-detail #detail #date').text(dataProperty.DateAdded);

                showNote();
            }
            else {
                var errorMessage = 'Property not found.';

                log(errorMessage, ERROR);

                $('#page-detail #detail #name').text(errorMessage);
                $('#page-detail #btn-update').addClass('ui-disabled');
                $('#page-detail #btn-delete-confirm').addClass('ui-disabled');
            }
        }
    });
}

function confirmDelete() {
    var text = $('#page-detail #frm-delete #txt-confirm').val();

    if (text == 'delete property now') {
        $('#page-detail #frm-delete #btn-delete').removeClass('ui-disabled');
        
    }
    else {
        $('#page-detail #frm-delete #btn-delete').addClass('ui-disabled');
    }
}

function deleteProperty(e) {
    e.preventDefault();
    navigator.notification.beep(1);
    var id = localStorage.getItem(currentPropertyId);

    db.transaction(function (tx) {
        var query = 'DELETE FROM Note WHERE PropertyId = ?';
        tx.executeSql(query, [id], function (tx, result) {
            log(`Delete notes of property '${id}' successfully.`);
        }, transactionError);

        var query = 'DELETE FROM Property WHERE Id = ?';
        tx.executeSql(query, [id], function (tx, result) {
            log(`Delete property '${id}' successfully.`);

            $('#page-detail #frm-delete').trigger('reset');

            $.mobile.navigate('#page-list', { transition: 'none' });
        }, transactionError);
    });
}
 function cancelDelete(){
    navigator.vibrate(1000, 1000, 1000);
 }
function addNote(e) {
    e.preventDefault();

    var id = localStorage.getItem(currentPropertyId);
    var message = $('#page-detail #frm-note #message').val();

    db.transaction(function (tx) {
        var query = `INSERT INTO Note (Message, PropertyId, DateAdded) VALUES (?, ?, julianday('now'))`;
        tx.executeSql(query, [message, id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Add new note to property '${id}' successfully.`);

            $('#page-detail #frm-note').trigger('reset');

            showNote();
        }
    });
}

function showNote() {
    var id = localStorage.getItem(currentPropertyId);

    db.transaction(function (tx) {
        var query = `SELECT Message, datetime(DateAdded, '+7 hours') AS DateAdded FROM Note WHERE PropertyId = ?`;
        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of notes successfully.`);

            var noteList = '';
            for (let note of result.rows) {
                noteList += `<div class = 'list'>
                                <small>${note.DateAdded}</small>
                                <h3>${note.Message}</h3>
                            </div>`;
            }

            $('#list-note').empty().append(noteList);

            log(`Show list of notes successfully.`);
        }
    });
}


function showUpdate() {
    var id = localStorage.getItem(currentPropertyId);

    db.transaction(function (tx) {
        var query = `SELECT * FROM Property WHERE Id = ?`;

        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            if (result.rows[0] != null) {
                log(`Get details of property '${result.rows[0].Name}' successfully.`);

                $(`#page-detail #frm-update #name-property`).val(result.rows[0].Name);
                $(`#page-detail #frm-update #address-property`).val(result.rows[0].Street);
                $(`#page-detail #frm-update #price`).val(result.rows[0].Price);
                $(`#page-detail #frm-update #bedroom`).val(result.rows[0].Bedroom);
                $(`#page-detail #frm-update #reporter-property`).val(result.rows[0].Reporter);
                // $(`#page-detail #frm-update #date`).val(result.rows[0].DateAdded);

                importCityOption($('#page-detail #frm-update #city'), 'City', result.rows[0].City);
                importDistrict($('#page-detail #frm-update #district'), result.rows[0].City, result.rows[0].District);
                importWard($('#page-detail #frm-update #ward'), result.rows[0].District, result.rows[0].Ward);

                selectOption($('#page-detail #frm-update #type'), Type, 'Type', result.rows[0].Type);
                selectOption($('#page-detail #frm-update #furniture'), Furniture, 'Furniture', result.rows[0].Furniture);

                changePopup($('#page-detail #setting'), $('#page-detail #frm-update'));
            }
        }
    });
}
// function updateAlert(){
//     var message = 'Update Successful!';
//     var buttonLabel = '';
//     var title = `Notification`;

//     navigator.notification.alert(message, buttonLabel, title);
// }
function updateProperty(e) {
    e.preventDefault();

    if (isValid('#page-detail #frm-update')) {
        var id = localStorage.getItem(currentPropertyId);
        var name = $('#page-detail #frm-update #name-property').val();
        var address = $('#page-detail #frm-update #address-property').val();
        var city = $('#page-detail #frm-update #city').val();
        var district = $('#page-detail #frm-update #district').val();
        var ward = $('#page-detail #frm-update #ward').val();
        var type = $('#page-detail #frm-update #type').val();
        var furniture = $('#page-detail #frm-update #furniture').val();
        var bedroom = $('#page-detail #frm-update #bedroom').val();
        var price = $('#page-detail #frm-update #price').val();
        var reporter = $('#page-detail #frm-update #reporter-property').val();
      

        db.transaction(function (tx) {
            
            var query = `UPDATE Property
                        SET Name = ?,
                            Street = ?, City = ?, District = ?, Ward = ?,
                            Type = ?, Bedroom = ?, Price = ?, Furniture = ?, Reporter = ?,
                            DateAdded = julianday('now')
                        WHERE Id = ?`;

            tx.executeSql(query, [name, address, city, district, ward, type, bedroom, price, furniture, reporter, id], transactionSuccess, transactionError);

            function transactionSuccess(tx, result) {
                
                log(`Update property '${name}' successfully.`);
               
                showDetail();

                $('#page-detail #frm-update').popup('close');
            }
            function transactionError(tx, result){
                var error = 'Name exists.';
                $('#page-detail #frm-update #error').empty().append(error);
                log(error, ERROR);
            }
        });
    }
}

function filterProperty() {
    var filter = $('#page-list #txt-filter').val().toLowerCase();
    var li = $('#page-list #list-property ul li');

    for (var i = 0; i < li.length; i++) {
        var a = li[i].getElementsByTagName("a")[0];
        var text = a.textContent || a.innerText;

        li[i].style.display = text.toLowerCase().indexOf(filter) > -1 ? "" : "none";
    }
}


function search(e) {
    e.preventDefault();

    var name = $('#page-search #frm-search #name-property').val();
    var street = $('#page-search #frm-search #address-property').val();
    var city = $('#page-search #frm-search #city').val();
    var district = $('#page-search #frm-search #district').val();
    var ward = $('#page-search #frm-search #ward').val();
    var type = $('#page-search #frm-search #type').val();
    var bedroom = $('#page-search #frm-search #bedroom').val();
    var furniture = $('#page-search #frm-search #furniture').val();
    var priceMin = $('#page-search #frm-search #priceMin').val();
    var priceMax = $('#page-search #frm-search #priceMax').val();
   
    db.transaction(function (tx) {
        var query = `SELECT Property.Id AS Id, Property.Name AS Name, Price, Bedroom, Type, City.Name AS City
                     FROM Property LEFT JOIN City ON Property.City = City.Id
                     WHERE`;
                     
        query += name ? ` Property.Name LIKE "%${name}%"   AND` : '';
        query += street ? ` Street LIKE "%${street}%"   AND` : '';
        query += city != -1 ? ` City = ${city}   AND` : '';
        query += district != -1 ? ` District = ${district}   AND` : '';
        query += ward != -1 ? ` Ward = ${ward}   AND` : '';
        query += type != -1 ? ` Type = ${type}   AND` : '';
        query += bedroom ? ` Bedroom = ${bedroom}   AND` : '';
        query += furniture != -1 ? ` Furniture = ${furniture}   AND` : '';
        query += priceMin ? ` Price >= ${priceMin}   AND` : '';
        query += priceMax ? ` Price <= ${priceMax}   AND` : '';
        
        query = query.substring(0, query.length - 6);

        tx.executeSql(query, [], transactionSuccess, transactionError);
       
        function transactionSuccess(tx, result) {
            log(`Search properties successfully.`);

            var propertyList = `<ul id='list-property' data-role='listview' class='ui-nodisc-icon ui-alt-icon'>`;

            propertyList += result.rows.length == 0 ? '<li><h2>There is no property.</h2></li>' : '';
        
            for (let property of result.rows) {
                propertyList +=
                    `<li><a data-details='{"Id" : ${property.Id}}'>
                    <h2 style='margin-bottom: 0px;'>${property.Name}</h2>
                    <p style='margin-top: 2px; margin-bottom: 10px;'><small>${property.City}</small></p>
                    
                    <div>
                                            
                        <img src='img/house.png' height='21px' style='margin-bottom: -5px;'>
                        <strong style='font-size: 13px;'>${Object.keys(Type)[property.Type]}<strong>
                        
                        &nbsp;&nbsp;

                        <img src='img/bedroom.png' height='20px' style='margin-bottom: -5px;'>
                        <strong style='font-size: 13px;'>${property.Bedroom}<strong>
                        
                        <br><br>

                        <img src='img/furnitures.png' height='21px' style='margin-bottom: -5px;'>
                        <strong style='font-size: 13px;'>${Object.keys(Furniture)[property.Furniture]}<strong>
                        
                        <br><br>
                           
                        <img src='img/money.png' height='20px' style='margin-bottom: -3px;'>
                        <strong style='font-size: 13px;'>${property.Price.toLocaleString('en-US')} VNĐ / month<strong>

                        
                    </div>
                </a></li>`;
            }
            propertyList += `</ul>`;
            $('#list-search-property').empty().append(propertyList).trigger('create');
        
            log(`Show list of properties successfully.`);

            location.href="#page-result";
            $('#page-search #frm-search').trigger('reset');
           
        }
    });
}

$(document).on('vclick', '#QR-code', takeQRCode);

function takeQRCode() {
    cordova.plugins.barcodeScanner.scan(success, error);

    function success(result) {
        alert(`Website link : ${result.text}.\nType: ${result.format}.`);
    }

    function error(error) {
        alert(`Failed: ${error}.`);
    }
}










