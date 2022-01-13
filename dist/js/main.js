import { 
    setLocationObject, 
    getHomeLocation,
    getWeatherFromCoords, 
    getCoordsFromApi,
    cleanText 
} from "./dataFunctions.js";

import {
    setPlaceholderText,
    addSpinner, 
    displayError, 
    displayApiError,
    updateDisplay
} from "./domFunctions.js"; 

import currentLocation from "./currentLocation.js";
const currentLoc = new currentLocation();

const initApp = () => {
    // add listeners
    // Location Button
    const geoButton = document.getElementById("getLocation");
    geoButton.addEventListener("click", getGeoWeather);

    // Home Button
    const homeButton = document.getElementById("home");
    homeButton.addEventListener("click", loadWeather);

    // Save Button
    const saveButton = document.getElementById("saveLocation");
    saveButton.addEventListener("click", saveLocation);

    // Unit Button
    const unitButton = document.getElementById("unit");
    unitButton.addEventListener("click", setUnitPref);

    // Refresh Button
    const refreshButton = document.getElementById("refresh");
    refreshButton.addEventListener("click", refreshWeather);

    // Search Box
    const locationEntry = document.getElementById("searchBar_form");
    locationEntry.addEventListener("click", submitNewLocation);

    // set up
    setPlaceholderText();

    // load weather
    loadWeather();
};

document.addEventListener("DOMContentLoaded", initApp);

const getGeoWeather = (event) => {
    if (event) {
        if(event.type === "click") {
            // add spinner
            const mapIcon = document.querySelector(".fa-map-marker-alt");
            addSpinner(mapIcon);
        }
    }

    if (!navigator.geolocation) {
        return geoError(); 
    }
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
};

const geoError = (errObj) => {
    const errMsg = errObj.message ? errObj.message : "Geolocation not supported";
    displayError(errMsg, errMsg);
};

const geoSuccess = (position) => {
    const myCoordsObj = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        name: `Lat:${position.coords.latitude} Long:${position.coords.longitude}`
    };

    // set location object
    setLocationObject(currentLoc, myCoordsObj);
    updateDataAndDisplay(currentLoc);
};

// Load Weather Function
const loadWeather = (event) => {
    const savedLocation = getHomeLocation();
    if (!savedLocation && !event) {
        return getGeoWeather();
    }
    if(!savedLocation && event.type === "click") {
        displayError (
            "No Home Location Saved.",
            "Sorry, Please save your home location first."
        );
    }
    else if(savedLocation && !event) {
        displayHomeLocationWeather(savedLocation);
    }
    else {
        const homeIcon = document.querySelector(".fa-home");
        addSpinner(homeIcon);
        displayHomeLocationWeather(savedLocation)
    }
};

const displayHomeLocationWeather = (home) => {
    if(typeof home === "string") {
        const locationJson = JSON.parse(home);
        const myCoordsObj = {
            lat: locationJson.lat,
            lon: locationJson.lon,
            name: locationJson.name,
            unit: locationJson.unit
        };
        setLocationObject(currentLoc, myCoordsObj);
        updateDataAndDisplay(currentLoc);
    }
};

const saveLocation = () => {
    if(currentLoc.getLat() && currentLoc.getLon) {
        const saveIcon = document.querySelector(".fa-save");
        addSpinner(saveIcon);
        const location = {
            name: currentLoc.getName(),
            lat: currentLoc.getLat(),
            lon: currentLoc.getLon(),
            unit: currentLoc.getUnit()
        };
        localStorage.setItem("defaultWeatherLocation", JSON.stringify(location));
    }
}

const setUnitPref = () => {
    const unitIcon = document.querySelector(".fa-chart-bar");
    addSpinner(unitIcon);
    currentLoc.toggleUnit();
    updateDataAndDisplay(currentLoc);
};

const refreshWeather = () => {
    const refreshIcon = document.querySelector(".fa-chart-bar");
    addSpinner(unitIcon);
    updateDataAndDisplay(currentLoc); 
};

const submitNewLocation = async (event) => {
    // form reloads page by default to prevent it
    event.preventDefault();
    const text = document.getElementById("searchBar_text").value;
    const entryText = cleanText(text);
    if(!entryText.length) {
        return;
    }
    const locationIcon = document.querySelector(".fa-search");
    addSpinner(locationIcon);
    const coordsData = await getCoordsFromApi(entryText, currentLoc.getUnit());
    
    // working with api data
    if(coordsData) {
        if(coordsData.cod === 200) {
            // success
            const myCoordsObj = {
                lat: coordsData.coord.lat,
                lon: coordsData.coord.lon,
                name: coordsData.sys.country 
                ? `${coordsData.name}, ${coordsData.sys.country}`
                : coordsData.name
            };
            setLocationObject(currentLoc, myCoordsObj);
            updateDataAndDisplay(currentLoc);

        }
        else {
            displayApiError(coordsData);
        }
    }
    else {
        displayError("Connection Error", "Connection Error");
    }
};

const updateDataAndDisplay = async (locationObj) => {
    // update data and display
    const weatherJson = await getWeatherFromCoords(locationObj);
    if(weatherJson) {
        updateDataAndDisplay(weatherJson, locationObj);
    }
}

