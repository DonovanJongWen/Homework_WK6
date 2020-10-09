$(document).ready(function () {
    console.clear();
    $("#mainPanel").hide();
    $("#cityNotFound").hide();
    loadCities();
    $("#cityTextSearch").focus().select();
});

var currentDate = ""
var citiesSearched = [];

function loadCities() {  // load cities stored in local storage array
    if (localStorage.getItem("city") !== null) {
        citiesSearched = JSON.parse(localStorage.getItem("city"));
        // check if key exist and then load buttons
        for (var i = 0; i < citiesSearched.length; i++) {
            const $buttonGroup = $("#btnGroup");
            const $button = $("<button>");
            $button.attr("class", "btn btn-light btnCity");
            $button.text(citiesSearched[i]);
            $buttonGroup.append($button);
        };
    };
};

function wtrSearch(city) {
    var queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=metric&appid=5e55803406a006cf8af82ba572274d10";
    $.ajax({
        url: queryURL,
        method: "GET",
        statusCode: { // check if city search was successful, if not display an alert
            404: function () {
                $("#cityNotFound").show();
            }
        }
    }).then(function (response) {
        $("#mainPanel").show();
        // display city searched and current date
        currentDate = new Date().toLocaleDateString("en-GB");
        $("#cityAndDate").text(response.name + " " + currentDate);
        // get the weather icon and display in panel
        var currentWeatherCode = response.weather[0].icon;
        $("#currentWeatherIcon").attr("src", "https://openweathermap.org/img/wn/" + currentWeatherCode + ".png")
        // get the current temp, truncate to one decimal point
        var currentTemp = response.main.temp;
        $("#currentTemp").text("Temperature: " + currentTemp.toFixed(1) + "°C");
        // get the current humidity
        var currentHumidity = response.main.humidity;
        $("#currentHumidity").text("Humidity: " + currentHumidity + "%");
        // get the current wind speed
        var currentWind = response.wind.speed;
        $("#currentWind").text("Wind Speed: " + currentWind + " km/h");
        // get the longitude and latittude of the city chosen, required for UV lookup
        var lat = response.coord.lat;
        var lon = response.coord.lon;
        // call the function to search for UV and 5 day forecast
        fiveDayandUVSearch(lon, lat);
        // call the function to add city to list of previous searches
        addToCityList(response.name);
    });

};

function fiveDayandUVSearch(lon, lat) {
    // use onecall paramater from api for UV and 5 day search
    var queryURL = "https://api.openweathermap.org/data/2.5/onecall?lon=" + lon + "&lat=" + lat + "&units=metric&exclude=hourly,minutely,alerts&appid=5e55803406a006cf8af82ba572274d10";
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {
        // get the current UV index
        var currentUV = response.current.uvi;
        // determine categiry of UV index and assign colour coded background
        if (currentUV < 3) {
            $("#currentUV").attr("style", "background-color: green;")
        } else if (currentUV >= 3 && currentUV < 6) {
            $("#currentUV").attr("style", "background-color: yellow;")
        } else if (currentUV >= 6 && currentUV < 8) {
            $("#currentUV").attr("style", "background-color: orange;")
        } else if (currentUV >= 8 && currentUV < 11) {
            $("#currentUV").attr("style", "background-color: red;")
        } else {
            $("#currentUV").attr("style", "background-color: violet;")
        }
        $("#currentUV").text(currentUV);
        // prepare for cards to show 5 day forecast
        const cardDeck = $(".card-deck");
        cardDeck.empty();

        // This section was created as the dt time in the response was local time and would sometimes display starting day after tomorrow.
        // Would occur when selecting a city in the USA due to the time difference here when it is in the evening here in Perth.
        // Will check if the day 0 in the response is equal to today, then change the for loop to 1-6

        var dayStart = 0
        var dayFinish = 5
        const timestampCheck = response.daily[0].dt;
        const selectedDateCheck = new Date(timestampCheck * 1000).toLocaleDateString("en-GB");
        if (currentDate === selectedDateCheck) {
            dayStart = 1;
            dayFinish = 6;
        }

        for (var i = dayStart; i < dayFinish; i++) {
            // create cards and elements
            const card = $("<div>");
            card.attr("class", "card text-white bg-primary mb-1");
            card.attr("style", "padding-left: 5px;");
            cardDeck.append(card);

            const cardBody = $("<div>");
            cardBody.attr("class", "card-body");
            card.append(cardBody);

            const h5El = $("<h5>");
            h5El.attr("class", "h5El");

            const timestamp = response.daily[i].dt;
            const selectedDate = new Date(timestamp * 1000).toLocaleDateString("en-GB");
            h5El.text(selectedDate);
            cardBody.append(h5El);

            const imgIcon = $("<img>");
            var currentWeatherCode = response.daily[i].weather[0].icon;
            imgIcon.attr("src", "https://openweathermap.org/img/wn/" + currentWeatherCode + ".png")
            const pTemp = $("<p>");
            pTemp.text("Temp: " + response.daily[i].temp.max.toFixed(1) + "°C");
            const pHumidity = $("<p>");
            pHumidity.text("Humidity: " + response.daily[i].humidity + "%");
            cardBody.append(imgIcon, pTemp, pHumidity);
        }
    });
};

function addToCityList(city) {
    const $buttonGroup = $("#btnGroup");
    const $button = $("<button>");
    // check if city is already in list before adding to the list
    if (!$("button:contains('" + city + "')").length) {
        $button.attr("class", "btn btn-light btnCity");
        $button.text(city);
        $buttonGroup.append($button);
        if (citiesSearched.length === 0) {
            citiesSearched[0] = city
        } else {
            citiesSearched.push(city);
        };
        localStorage.setItem("city", JSON.stringify(citiesSearched));
    };
}

$("#btnSearch").on("click", function (event) {
    // click event when search button is clicked
    $("#cityNotFound").hide(); // hides the city not found alert if it is shown
    event.preventDefault();
    var city = $("#cityTextSearch").val();
    wtrSearch(city); // get the text of the search and call funtion to search for current weather
    $("#cityTextSearch").focus().select();
});

$("#cityTextSearch").on("keyup", function (e) {
    // same as button click event that responds to enter button
    $("#cityNotFound").hide();
    if (e.key == "Enter") {
        event.preventDefault();
        wtrSearch(e.target.value);
        $("#cityTextSearch").focus().select();
    }
});

$("#btnGroup").on("click", ".btnCity", function (event) {
    // click event when a city previously searched is clicked in the list
    $("#cityNotFound").hide();
    event.preventDefault();
    var city = $(this).text();
    wtrSearch(city);
    $("#cityTextSearch").val("");
});