// Code for initializing the app

// global variables shared across scripts
var city = '';
var latitude = '';
var longitude = '';
var gps_coords = false;
var vehicle_id = '';
const constraints = window.constraints = {
  audio: false,
  video: {
    facingMode: {
      exact: "environment"
    }
  },
};
const socket = io();

// This disables the click on the navbar elements - 
// navigation is purely handled by the back and continue buttons
$(document).ready(function () {
    $(".nav li.disabled a").click(function () {
        return false;
    });
});

$('body').on('click', '.disabled', function (e) {
    e.preventDefault();
    return false;
});


// Get the city in which this app is opened 
// TODO: change this to work in non-city jusrisdictions like 
//         unincorporated King County and UW
function getCity() {
    $.get('https://ipapi.co/json/', function (data) {
        console.log(data)

        city = data.city;
        if (gps_coords == false) {
            latitude = data.latitude;
            longitude = data.longitude;
        }
        // DIsplay the city name on the UI
        $('#city_name').append('<p>' + city + '</p>');

        console.log("coordinates from IP API");
        console.log(`Latitude : ${latitude}`);
        console.log(`Longitude: ${longitude}`);
        if (city != '' && socket != null) {

            socket.emit('city_sensed', {
                'city': city
            });
        }

        // Get the companies and infractions for the city in question 
        window.performance.mark('before_getCompanies');
        getCompanies()
        window.performance.mark('after_getCompanies');
        window.performance.measure('get_getCompanies_exec', 'before_getCompanies', 'after_getCompanies');
        window.performance.mark('before_getInfractions');
        getInfractions()
        window.performance.mark('after_getInfractions');
        window.performance.measure('get_getInfractions_exec', 'before_getInfractions', 'after_getInfractions');
        
    });
}


function getCompanies() {
    socket.on('cityCompanies', function (data) {
        console.log(data);
        var companies = data.companies;
        if (companies.length > 0) {
            window.performance.mark('before_populateCompanies');
            populateCompanies(companies);
            window.performance.mark('after_populateCompanies');
            window.performance.measure('get_populateCompanies_exec', 'before_populateCompanies', 'after_populateCompanies');
        } else {
            $('#company_div').empty();
            $('#company_div').append(
                $('<p/>')
                    .addClass('light-background text-danger')
                    .html('No companies found in this region. Maybe allow GPS location access and refresh page.')
            )
        }
    });
}

function getInfractions() {
    socket.on('cityInfractions', function (data) {
        console.log(data);
        var infractions = data.infractions;
        if (infractions.length > 0) {
            window.performance.mark('before_populateInfractions');
            populateInfractions(infractions);
            window.performance.mark('after_populateInfractions');
            window.performance.measure('get_populateInfractions_exec', 'before_populateInfractions', 'after_populateInfractions');
        } else {
            $('#infraction_div').removeClass('low-opacity');
            $('#infraction_div').addClass('high-opacity');
            $('#infraction_div').empty();
            $('#infraction_div').append(
                $('<p/>')
                    .addClass('light-background text-danger')
                    .html('No infractions found in this region. Maybe allow GPS location access and refresh page.')
            )
        }

    });
}

function populateCompanies(companies) {

    if (companies.length > 0) {
        companies.forEach((company) => {
            // create the company name html element
            $company_name = $('<label/>')
                .addClass("btn active light-background darktext margin-company")
                .append(
                    $('<input/>')
                        .attr("id", 'company_' + company.micromobilityservice_id)
                        .attr("type", "radio")
                        .attr("name", 'company_' + company.micromobilityservice_id)
                        .attr("autocomplete", "off")
                )
                .append(
                    $('<img/>')
                        .attr("src", "data:image/png;base64, " + company.vehicle_image)
                        .attr("width", "80px")
                        .attr("height", "80px")
                )
                .append(company.company_name)

            // append the element to the company-name list
            $company_name.appendTo('#company_list');
        });
    } else {

    }


    $('[data-toggle="radiobuttons"] .btn').on('click', function () {
        // toggle style
        // $(this).removeClass('light-background');
        $(this).addClass('dark-border');
        $(this).siblings().removeClass('dark-border')
        // $('[data-toggle="radiobuttons"]').find(label)
        // toggle checkbox
        var $chk = $(this).find('input:radio');
        $chk.prop('checked', true);
        $('input:radio').not($chk).prop('checked', false);

        return false;
    });

}

function populateInfractions(infractions) {

    infractions.forEach((infraction) => {
        // create the infraction description checkbox element
        $infraction_description = $('<label/>')
            .addClass("btn btn-block active light-background darktext")
            .append(
                $('<input/>')
                    .attr("id", 'infraction_' + infraction.infractiontype_id)
                    .attr("type", "checkbox")
                    .attr("name", 'infraction_' + infraction.infractiontype_id)
                    .attr("autocomplete", "off")
            )
            .append(infraction.infraction_description)
        $infraction_description.appendTo('#infraction_list');
    });

    $('[data-toggle="buttons"] .btn').on('click', function () {
        // toggle style
        // $(this).removeClass('light-background');
        $(this).toggleClass('blue-background light-background active');

        // toggle checkbox
        var $chk = $(this).find('[type=checkbox]');
        $chk.prop('checked', !$chk.prop('checked'));

        return false;
    });

}

window.performance.mark('before_getCity');
getCity()
window.performance.mark('after_getCity');
window.performance.measure('get_getCity_exec', 'before_getCity', 'after_getCity');

// Using promises to ensure this part executes before map is drawn
// From here: https://stackoverflow.com/a/55698897/1328232
let getLocation = new Promise(function (resolve, reject) {

    var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    function success(pos) {
        var crd = pos.coords;

        console.log('Your current position is:');
        console.log(`Latitude : ${crd.latitude}`);
        console.log(`Longitude: ${crd.longitude}`);
        console.log(`More or less ${crd.accuracy} meters.`);
        latitude = crd.latitude;
        longitude = crd.longitude;
        gps_coords = true;
        resolve();
               // alert(`Latitude : ${crd.latitude}` + `, Longitude: ${crd.longitude}`)
        // ipLookUp()
    }

    function error(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
        // ipLookUp()
        resolve();
        // alert(`ERROR(${err.code}): ${err.message}`);

    }

    if ("geolocation" in navigator) {
        // Todo: figure out why the promise is called first
        navigator.geolocation.getCurrentPosition(success, error, options);
    } else {
        // geolocation is not supported
        // get your location some other way
        console.log('geolocation is not enabled on this browser')
        // alert('geolocation is not enabled on this browser')
        // ipLookUp()
    }

});

// Map
async function drawMap() {
    window.performance.mark('before_getLocation');
    let result = await getLocation;
    window.performance.mark('after_getLocation');
    window.performance.measure('get_getLocation_exec', 'before_getLocation', 'after_getLocation');
    // getAddress();
    console.log(latitude, longitude)
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2hpbnRhbnAiLCJhIjoiY2ppYXU1anVuMThqazNwcDB2cGtneDdkYyJ9.TL6RTyRRFCbvJWyFa4P0Ow';
    // var coordinates = document.getElementById('coordinates');
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [longitude, latitude],
        zoom: 13
    });

    // create the popup
    var popup = new mapboxgl.Popup({ offset: 25, closeOnClick: false, closeButton: false }).setText(
        'Move the marker to wheel location.'
    );

    var marker = new mapboxgl.Marker({
        draggable: true
    })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map)
        .togglePopup();

    function onDragEnd() {
        var lngLat = marker.getLngLat();
        // Set the new lat, lng based on the post drag location
        longitude = lngLat.lng;
        latitude = lngLat.lat;
        console.log(`New coordinates are: (${latitude}, ${longitude})`);

    }

    marker.on('dragend', onDragEnd);
}

var enableQRCodeReader = function() {
    window.performance.mark('start_qrcodeLoad');
  let selectedDeviceId;
  const codeReader = new ZXing.BrowserMultiFormatReader()
  console.log('ZXing code reader initialized')
  codeReader.getVideoInputDevices()
    .then((videoInputDevices) => {
      console.log(videoInputDevices);

      codeReader.decodeFromConstraints(constraints, 'video', (result, err) => {
        window.performance.mark('start_decodeFromConstraints');
        if (result) {
          vehicle_id = result.text
          console.log(result)
          document.getElementById('result').textContent = vehicle_id
          codeReader.stopContinuousDecode()
          $('#video').remove();
        }
        if (err && !(err instanceof ZXing.NotFoundException)) {
          console.error(err)
          document.getElementById('result').textContent = err
        }
        window.performance.mark('end_decodeFromConstraints');
        window.performance.measure('get_decodeFromConstraints_exec', 'start_decodeFromConstraints', 'end_decodeFromConstraints');
      })
        .catch((err) => {
          console.error(err)
        })

    })
  window.performance.mark('end_qrcodeLoad');
  window.performance.measure('get_qrcodeLoad_exec', 'start_qrcodeLoad', 'end_qrcodeLoad');
}

var socketSubmit = function () {
    window.performance.mark('start_socketSubmit');
    socket.emit('case_report', {
        case_data: {
            imageId: imageId,
            location: [longitude, latitude],
            infraction_ids: infraction_ids,
            micromobilityservice_id: micromobilityservice_id,
            vehicle_id: vehicle_id,
            city: city
        }
    });
    window.performance.mark('end_socketSubmit');
    window.performance.measure('get_socketSubmit_exec', 'start_socketSubmit', 'end_socketSubmit');
    window.location.href = "./html/thanks.html";
}

window.performance.mark('before_drawMap');
drawMap();
window.performance.mark('after_drawMap');
window.performance.measure('get_drawMap_exec', 'before_drawMap', 'after_drawMap');