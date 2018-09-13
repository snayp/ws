function ExtApi(apiHost, login, pass) {
    this.apiHost = apiHost;
    this.login = login;
    this.pass = pass;
}

ExtApi.prototype.callMethod = function(methodType, path, data) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            type: methodType,
            url: this.apiHost + path,
            xhrFields: {
                withCredentials: true
            },
            headers: {
                "Authorization": "Basic " + btoa(this.login + ":" + this.pass)
            },
            contentType: "application/json",
            dataType: "json",
            data: data
        }).then(resolve).fail(reject);
    }.bind(this));
};

// search
ExtApi.prototype.search = function(searchDTO, url) {
    const s = JSON.stringify(searchDTO);
    return this.callMethod("POST", url, s);
};

// prebook
ExtApi.prototype.prebook = function(offer, payer) {
    return this.callMethod("POST", "/api/ext/service/prebook?offer=" + offer + "&payer=" + payer);
};

// book
ExtApi.prototype.book = function(serviceId, bookDTO) {
    return this.callMethod("POST", "/api/ext/service/" + serviceId + "/book?currency=EUR", bookDTO);
};

// check status
ExtApi.prototype.checkStatus = function(serviceId) {
    return this.callMethod("POST", "/api/ext/service/" + serviceId + "/checkstatus");
};

// cancel
ExtApi.prototype.cancel = function(serviceId) {
    return this.callMethod("POST", "/api/ext/service/" + serviceId + "/cancel");
};

// cancel
ExtApi.prototype.voucher = function(serviceId) {
    return this.callMethod("GET", "/api/ext/service/" + serviceId + "/voucher");
};

// Location
ExtApi.prototype.locationCountries = function () {
    return this.callMethod("GET", "/api/ext/location/countries");
};
ExtApi.prototype.locationRegions = function (countryId) {
    return this.callMethod("GET", "/api/ext/location/regions?countryId=" + countryId);
};
ExtApi.prototype.locationIslands = function (countryId) {
    return this.callMethod("GET", "/api/ext/location/islands?countryId=" + countryId);
};
ExtApi.prototype.locationAreas = function (countryId) {
    return this.callMethod("GET", "/api/ext/location/areas?countryId=" + countryId);
};
ExtApi.prototype.locationCities = function (countryId) {
    return this.callMethod("GET", "/api/ext/location/cities?countryId=" + countryId);
};
ExtApi.prototype.locationVillages = function (countryId) {
    return this.callMethod("GET", "/api/ext/location/villages?countryId=" + countryId);
};
ExtApi.prototype.locationLocations = function (countryId) {
    return this.callMethod("GET", "/api/ext/location/locations?countryId=" + countryId);
};
ExtApi.prototype.locationAirports = function (countryId) {
    return this.callMethod("GET", "/api/ext/location/airports?countryId=" + countryId);
};
ExtApi.prototype.locationTrainstations = function (countryId) {
    return this.callMethod("GET", "/api/ext/location/trainstations?countryId=" + countryId);
};
ExtApi.prototype.locationPorts = function (countryId) {
    return this.callMethod("GET", "/api/ext/location/ports?countryId=" + countryId);
};
ExtApi.prototype.locationHotels = function (countryId) {
    return this.callMethod("GET", "/api/ext/location/hotels?countryId=" + countryId);
};

ExtApi.prototype.locationExcursions = function (countryId) {
    return this.callMethod("GET", "/api/ext/location/excursions?countryId=" + countryId);
};

ExtApi.prototype.infoHotel = function (hotelId) {
    return this.callMethod("GET", "/api/ext/info/hotel/" + hotelId);
};

ExtApi.prototype.infoExcursion = function (excursionId) {
    return this.callMethod("GET", "/api/ext/info/excursion/" + excursionId);
};

ExtApi.prototype.searchWhileNotDone = function (searchDTO, url) {
    const $coa = this;

    return new Promise(function (resolve, reject) {

        let paginationQuery = function() {
            $coa.search(searchDTO, url).then(function (data) {
                ServiceValidate.validateExtApiSearchResponse(data);

                var searchDone = data.success.done;
                if (!searchDone) {
                    setTimeout(function() {
                        paginationQuery();
                    }, 1500);
                    throw "WAIT";
                } else {
                    resolve(data);
                }

            }).catch(function (response) {
                if (response === "WAIT") {
                    return;
                }
                reject(response);
            });
        };
        paginationQuery();
    });
};

