var map = L.map('map', {
  center: [44.967243, -103.77155],
  zoom: 13
});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var center_icon = L.icon({
  iconUrl: 'location-crosshairs-solid.svg',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [10, 10]
});
const center = L.marker([0, 0], { icon: center_icon }).addTo(map);
//const center2 = L.marker([0, 0]).addTo(map);

const alerts = document.getElementById("alerts");
function addAlert(message) {
  console.warn(message);
  let newAlert = document.createElement("div");
  newAlert.setAttribute("class", "alert");
  newAlert.innerHTML = message;
  alerts.appendChild(newAlert);
  return newAlert;
}

async function getLocation() {
  return await new Promise((resolve, reject) => {
    window.navigator.geolocation.getCurrentPosition(resolve);
  });
}

function updateMapCenter(lat, lon) {
  var centerAt = L.latLng(lat, lon);
  center.setLatLng(centerAt);
  //center2.setLatLng(centerAt);
  if (!window.flighttime.initial_pan) {
    window.flighttime.initial_pan = true;
    map.panTo(centerAt);
  }
}

async function centerOnUserLocation() {
  let currLocation = await getLocation();
  let accuracy = currLocation.coords.accuracy;
  let latitude = currLocation.coords.latitude;
  let longitude = currLocation.coords.longitude;
  console.log([accuracy, latitude, longitude]);
  updateMapCenter(latitude, longitude);
  map.panTo([latitude, longitude]);
}

class Region {
  constructor(vertices, popup) {
    this.vertices = vertices;
    this.popup = popup ?? "";
  }

  addTo(map) {
    var poly = L.polygon(this.vertices, { color: 'red' });
    poly.addTo(map);

    var popup = L.popup().setContent(this.popup);
    poly.bindPopup(popup);
    return poly;
  }
}

async function loadTFRs() {
  var rtfrs = await fetch("https://tfrs.jasonho.workers.dev");
  var utfrs = await rtfrs.text();
  var tfrs = JSON.parse(utfrs);
  for (let tfr of tfrs) {
    var rdeets = null
    try {
      rdeets = await fetch("https://tfrs.jasonho.workers.dev/" + tfr.notam);
    } catch (ex) {
      addAlert("NOTAM " + tfr.notam + " could not be loaded!");
      console.warn(tfr);
      continue;
    }
    var udeets = await rdeets.text();
    var deets = JSON.parse(udeets);

    var tfrsToDraw = [];
    if (deets.airspace instanceof Array) {
      //addAlert("NOTAM " + tfr.notam + " has multiple boundaries");
      //console.warn(deets);
      for (let airspace of deets.airspace) {
        tfrsToDraw.push([airspace.boundary.vertices, tfr, deets, airspace]);
      }
    } else {
      if (!deets.airspace.boundary || deets.airspace.boundary == null) {
        addAlert("NOTAM " + tfr.notam + " has no defined boundary!");
        console.warn(deets);
        continue;
      }
      if (!deets.airspace.boundary.vertices) {
        addAlert("NOTAM " + tfr.notam + " has no defined vertices!");
        console.warn(deets);
        continue;
      }
      tfrsToDraw.push([deets.airspace.boundary.vertices, tfr, deets, deets.airspace]);
    }

    for (let [vertices, tfr, details, airspace] of tfrsToDraw) {
      new Region(vertices, `
          <small>${tfr.facility}</small><br/>
          <b>NOTAM ${tfr.notam}</b><br/>
          <i>${tfr.type}</i><br/>
          ${tfr.description}<br/>
          <br/>
          <a target="_blank" href=${tfr.links.details}>
            <small>See Listing</small>
          </a>`).addTo(map);
    }
  }
}

async function main() {
  window.flighttime = {};
  navigator.geolocation.watchPosition((position) => {
    let accuracy = position.coords.accuracy;
    let latitude = position.coords.latitude;
    let longitude = position.coords.longitude;
    console.log([accuracy, latitude, longitude]);
    updateMapCenter(latitude, longitude);
  }, (error) => {
    console.err("Failed geolocation watch!");
    console.err(error);
  });
  setInterval(async () => {
    //await taskUserLocation();
  }, 1000);
  await loadTFRs();
}

(async function() {
  await main();
  addAlert("Test alert 1");
})();