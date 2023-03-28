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
  //map.panTo(centerAt);
}

async function taskUserLocation() {
  let currLocation = await getLocation();
  let accuracy = currLocation.coords.accuracy;
  let latitude = currLocation.coords.latitude;
  let longitude = currLocation.coords.longitude;
  console.log([accuracy, latitude, longitude]);
  updateMapCenter(latitude, longitude);
}

async function loadTFRs() {
  var rtfrs = await fetch("https://tfrs.jasonho.workers.dev");
  var utfrs = await rtfrs.text();
  var tfrs = JSON.parse(utfrs);
  for (let tfr of tfrs) {
    var rdeets = await fetch("https://tfrs.jasonho.workers.dev/" + tfr.notam);
    var udeets = await rdeets.text();
    var deets = JSON.parse(udeets);
    if (deets.airspace instanceof Array) {
      addAlert("NOTAM " + tfr.notam + " has multiple boundaries");
      console.warn(deets);
    } else {
      if (!deets.airspace.boundary || deets.airspace.boundary == null) {
        addAlert("NOTAM " + tfr.notam + " has no defined boundary!");
      console.warn(deets);
      }
      if (!deets.airspace.boundary.vertices) {
        addAlert("NOTAM " + tfr.notam + " has no defined vertices!");
      console.warn(deets);
      }
      L.polygon(deets.airspace.boundary.vertices, { color: 'red' }).addTo(map);
    }
  }
}

async function main() {
  setInterval(async () => {
    await taskUserLocation();
  }, 1000);
  await loadTFRs();
}

(async function() {
  await main();
  addAlert("Test alert 1");
})();