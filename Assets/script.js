$(document).ready(function () {
    console.clear();
    $("#mainPanel").hide();
    $("#cityNotFound").hide();
    loadCities();
    $("#cityTextSearch").focus().select();
});

var currentDate = ""
var citiesSearched = [];

function loadCities() {
    if (localStorage.getItem("city") !== null) {
        citiesSearched = JSON.parse(localStorage.getItem("city"));
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
    var queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=metric&appid=c96abfeae19d2171913c0c0393fca455";
    $.ajax({
        url: queryURL,
        method: "GET",
        statusCode: { 
            404: function () {
                $("#cityNotFound").show();
            }
        }
    }).then(function (response) {
        $("#mainPanel").show();
        currentDate = new Date().toLocaleDateString("en-GB");
        $("#cityAndDate").text(response.name + " " + currentDate);
        var currentWeatherCode = response.weather[0].icon;
        $("#currentWeatherIcon").attr("src", "https://openweathermap.org/img/wn/" + currentWeatherCode + ".png")
        var currentTemp = response.main.temp;
        $("#currentTemp").text("Temperature: " + currentTemp.toFixed(1) + "°C");
        var currentHumidity = response.main.humidity;
        $("#currentHumidity").text("Humidity: " + currentHumidity + "%");
        var currentWind = response.wind.speed;
        $("#currentWind").text("Wind Speed: " + currentWind + " km/h");
        var lat = response.coord.lat;
        var lon = response.coord.lon;
        fiveDayandUVSearch(lon, lat);
        addToCityList(response.name);
    });

};

function fiveDayandUVSearch(lon, lat) {
    var queryURL = "https://api.openweathermap.org/data/2.5/onecall?lon=" + lon + "&lat=" + lat + "&units=metric&exclude=hourly,minutely,alerts&appid=c96abfeae19d2171913c0c0393fca455";
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {
        var currentUV = response.current.uvi;
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
        const cardDeck = $(".card-deck");
        cardDeck.empty();

        var dayStart = 0
        var dayFinish = 5
        const timestampCheck = response.daily[0].dt;
        const selectedDateCheck = new Date(timestampCheck * 1000).toLocaleDateString("en-GB");
        if (currentDate === selectedDateCheck) {
            dayStart = 1;
            dayFinish = 6;
        }

        for (var i = dayStart; i < dayFinish; i++) {
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
    $("#cityNotFound").hide();
    event.preventDefault();
    var city = $("#cityTextSearch").val();
    wtrSearch(city);
    $("#cityTextSearch").focus().select();
});

$("#cityTextSearch").on("keyup", function (e) {
    $("#cityNotFound").hide();
    if (e.key == "Enter") {
        event.preventDefault();
        wtrSearch(e.target.value);
        $("#cityTextSearch").focus().select();
    }
});

$("#btnGroup").on("click", ".btnCity", function (event) {
    $("#cityNotFound").hide();
    event.preventDefault();
    var city = $(this).text();
    wtrSearch(city);
    $("#cityTextSearch").val("");
});