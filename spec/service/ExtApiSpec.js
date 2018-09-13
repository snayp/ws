describe("extapi-services", function () {
    var extApi = new ExtApi(Settings.apiLocation, Settings.user.login, Settings.user.pass);

    const payer = Settings.payerId;

    // hotels
    const hotelsUrl = "/api/ext/search/hotel-by-city";
    const searchByCityDTO = {
        place: {
            in: "CI4M1N"//Paris
        },
        num: 10,
        date: {
            in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
            out: new Date().getTime() + 60 * 60 * 24 * 42 * 1000
        },
        families: [
            {
                adults: 1
            }
        ],
        providers: ["test"]
    };

    // hotel
    const hotelUrl = "/api/ext/search/hotel-by-id";
    const searchByHotelDTO = {
        place: {
            in: "HO11IMA"//Minos Beach Art Hotel
        },
        num: 10,
        date: {
            in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
            out: new Date().getTime() + 60 * 60 * 24 * 42 * 1000
        },
        families: [
            {
                adults: 1
            }
        ],
        providers: ["test"]
    };

    // transfer
    var transferUrl = "/api/ext/search/transfer";
    var searchTransferDTO = {
        place: {
            in: "AI0FO8",//Domodedovo International Airport
            out: "HOWXKS"//Holiday Village Moscow
        },
        num: 10,
        date: {
            in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
            intime: 43200000
        },
        families: [
            {
                adults: 1
            }
        ],
        providers: ["test"]
    };

    // excursion
    var excursionUrl = "/api/ext/search/excursion";
    var searchExcursionDTO = {
        place: {
            in: "CI2IKC"//Bratislava
        },
        num: 10,
        date: {
            in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
            intime: 43200000
        },
        families: [
            {
                adults: 1
            }
        ],
        providers: ["test"]
    };

    // yacht
    var yachtUrl = "/api/ext/search/yacht";
    var searchYachtDTO = {
        place: {
            in: "CI2ZK0"//Salerno
        },
        num: 10,
        date: {
            in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
            out: new Date().getTime() + 60 * 60 * 24 * 47 * 1000,
        },
        families: [
            {
                adults: 1
            }
        ],
        providers: ["test"]
    };

    // package
    var packageUrl = "/api/ext/search/package";
    var searchPackageDTO = {
        place: {
            in: "CI1F9O",//Moscow
            out: "CI0QZV"//Berlin
        },
        num: 10,
        date: {
            in: new Date().getTime() + 60 * 60 * 24 * 42 * 1000,
            out: new Date().getTime() + 60 * 60 * 24 * 47 * 1000,
        },
        families: [
            {
                adults: 2
            }
        ]
    };

    var validateResponse = function(success) {
        expect(success.search).not.toBeUndefined();
        expect(success.search).not.toBeNull();
        expect(success.search.length).toBeGreaterThan(0);
    };

    const bookDTO = JSON.stringify({
        tourists: [
            [
                {
                    name: {
                        first: "Extapi",
                        last: "Testov"
                    },
		            gender: "male",
		            birthday: 636854400000
                }
            ]
        ]
    });

    it("search hotels by city", function(done) {
        var paginationQuery = function() {
            extApi.search(searchByCityDTO, hotelsUrl).then(function(data) {
                ServiceValidate.validateExtApiSearchResponse(data);

                var searchDone = data.success.done;
                if (!searchDone) {
                    setTimeout(function() {
                        paginationQuery();
                    }, 1500);
                    throw "WAIT";
                } else {
                    validateResponse(data.success);
                    done();
                }
            }).catch(function (response) {
                if(response === "WAIT") {
                    return;
                }
                console.error(response);
                fail("Не работает тест!");
                done();
            });
        };

        paginationQuery();
    }, 60000);

    it("search two rooms in city", function(done) {
        const searchQuery = {
            place: {
                "in": "CI861854PA"
            },
            num: 5,
            date: {
                "in": new Date().getTime() + 60 * 60 * 24 * 45 * 1000,
                "out": new Date().getTime() + 60 * 60 * 24 * 48 * 1000
            },
            families: [
                {
                    adults: 2
                },
                {
                    adults: 1
                }
            ],
            providers: ["test"]
        };

        extApi.searchWhileNotDone(searchQuery, hotelsUrl).then(function(data) {
            validateResponse(data.success, done);
            data.success.search.forEach((h,i) => {
                let fName = "data.success.search[" + i + "]";
                ServiceValidate.validateMultiAcc(h, fName, searchQuery.families.length)
            });
            done();


        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест!");
            done();
        });

    }, 60000);

    it("search with scrolling", function(done) {

        const searchQuery = {
            place: {
                in: "CI4M1N"//Paris
            },
            num: 3,
            lastid : 0,
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                out: new Date().getTime() + 60 * 60 * 24 * 43 * 1000
            },
            families: [
                {
                    adults: 2
                }
            ]
        };
        //
        // extApi.searchWhileNotDone(searchQuery, hotelsUrl).then(function(data) {
        //     validateResponse(data.success, done);
        // }).catch(function (response) {
        //     console.error(response);
        //     fail("Не работает тест!");
        //     done();
        // });

        var paginationQuery = function() {
            extApi.search(searchQuery, hotelsUrl).then(function(data) {
                ServiceValidate.validateExtApiSearchResponse(data);

                var success = data.success;


                // если ещё не нашлось требуемого кол-ва, ждем
                if (!success.done) {
                    setTimeout(function() {
                        paginationQuery(searchQuery);
                    }, 2000);
                    throw "WAIT";
                } else if(success.search.length >= searchQuery.num) {
                    searchQuery.lastid += searchQuery.num;
                    paginationQuery(searchQuery);
                } else {
                    done();
                }
            }).catch(function (response) {
                if(response === "WAIT") {
                    return;
                }
                console.error(response);
                fail("Не работает тест!");
                done();
            });
        };

        paginationQuery();
    }, 60000);

    it("search hotel by id", function(done) {
        var paginationQuery = function() {
            extApi.search(searchByHotelDTO, hotelUrl).then(function(data) {
                ServiceValidate.validateExtApiSearchResponse(data);

                var searchDone = data.success.done;
                if (!searchDone) {
                    sleep(1500).then(() => {
                        paginationQuery();
                    });
                    throw "WAIT";
                } else {
                    validateResponse(data.success, done);
                    done();
                }
            }).catch(function (response) {
                if(response === "WAIT") {
                    return;
                }
                console.error(response);
                fail("Не работает тест!");
                done();
            });
        };

        paginationQuery();
    }, 60000);

    it("search transfers", function(done) {
        var paginationQuery = function() {
            extApi.search(searchTransferDTO, transferUrl).then(function(data) {
                ServiceValidate.validateExtApiSearchResponse(data);

                var searchDone = data.success.done;
                if (!searchDone) {
                    sleep(1500).then(() => {
                        paginationQuery();
                    });
                    throw "WAIT";
                } else {
                    validateResponse(data.success, done);
                    done();
                }
            }).catch(function (response) {
                if(response === "WAIT") {
                    return;
                }
                console.error(response);
                fail("Не работает тест!");
                done();
            });
        };

        paginationQuery();
    }, 60000);

    it("search excursions", function(done) {
        var paginationQuery = function() {
            extApi.search(searchExcursionDTO, excursionUrl).then(function(data) {
                ServiceValidate.validateExtApiSearchResponse(data);

                var searchDone = data.success.done;
                if (!searchDone) {
                    sleep(1500).then(() => {
                        paginationQuery();
                    });
                    throw "WAIT";
                } else {
                    validateResponse(data.success, done);
                    done();
                }
            }).catch(function (response) {
                if(response === "WAIT") {
                    return;
                }
                console.error(response);
                fail("Не работает тест!");
                done();
            });
        };

        paginationQuery();
    }, 60000);

    it("search yachts", function(done) {
        var paginationQuery = function() {
            extApi.search(searchYachtDTO, yachtUrl).then(function(data) {
                ServiceValidate.validateExtApiSearchResponse(data);

                var searchDone = data.success.done;
                if (!searchDone) {
                    sleep(1500).then(() => {
                        paginationQuery();
                    });
                    throw "WAIT";
                } else {
                    validateResponse(data.success, done);
                    done();
                }
            }).catch(function (response) {
                if(response === "WAIT") {
                    return;
                }
                console.error(response);
                fail("Не работает тест!");
                done();
            });
        };

        paginationQuery();
    }, 60000);

    it("search packages", function(done) {
        var paginationQuery = function() {
            extApi.search(searchPackageDTO, packageUrl).then(function(data) {
                ServiceValidate.validateExtApiSearchResponse(data);

                var searchDone = data.success.done;
                if (!searchDone) {
                    sleep(1500).then(() => {
                        paginationQuery();
                    });
                    throw "WAIT";
                } else {
                    validateResponse(data.success, done);
                    done();
                }
            }).catch(function (response) {
                if(response === "WAIT") {
                    return;
                }
                console.error(response);
                fail("Не работает тест!");
                done();
            });
        };

        paginationQuery();
    }, 60000);

    it("prebook", function(done) {
        var paginationQuery = function() {
            extApi.search(searchByCityDTO, hotelsUrl).then(function(data) {
                ServiceValidate.validateExtApiSearchResponse(data);

                var searchDone = data.success.done;
                if (!searchDone) {
                    sleep(1500).then(() => {
                        paginationQuery();
                    });
                    throw "WAIT";
                } else {
                    expect(data.success.search).not.toBeNull();
                    expect(data.success.search.length).toBeGreaterThan(0);
                    var hotel = data.success.search[0];
                    expect(hotel.items).not.toBeNull();
                    expect(hotel.items.length).toBeGreaterThan(0);
                    expect(hotel.items[0].length).toBeGreaterThan(0);
                    var room = hotel.items[0][0];
                    expect(room).not.toBeNull();
                    expect(room.commerce).not.toBeNull();
                    expect(room.commerce.offer).not.toBeNull();

                    return extApi.prebook(room.commerce.offer, payer);
                }
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.success).not.toBeNull();
                expect(data.error).toBeNull();
                expect(data.status).toBe(0);
                expect(data.success.serviceId).not.toBeNull();
                expect(data.success.isPrebookSuccess).not.toBeNull();
                expect(data.success.isPrebookSuccess).toBeTruthy();

                done();
            }).catch(function (response) {
                if(response === "WAIT") {
                    return;
                }
                console.error(response);
                fail("Не работает тест!");
                done();
            });
        };

        paginationQuery();
    }, 60000);

    it("book", function(done) {
        var context = {};
        var paginationQuery = function() {
            extApi.search(searchByCityDTO, hotelsUrl).then(function(data) {
                ServiceValidate.validateExtApiSearchResponse(data);

                var searchDone = data.success.done;
                if (!searchDone) {
                    sleep(1500).then(() => {
                        paginationQuery();
                    });
                    throw "WAIT";
                } else {
                    expect(data.success.search).not.toBeNull();
                    expect(data.success.search.length).toBeGreaterThan(0);
                    var hotel = data.success.search[0];
                    expect(hotel.items).not.toBeNull();
                    expect(hotel.items.length).toBeGreaterThan(0);
                    expect(hotel.items[0].length).toBeGreaterThan(0);
                    var room = hotel.items[0][0];
                    expect(room).not.toBeNull();
                    expect(room.commerce).not.toBeNull();
                    expect(room.commerce.offer).not.toBeNull();

                    return extApi.prebook(room.commerce.offer, payer);
                }
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.success).not.toBeNull();
                expect(data.error).toBeNull();
                expect(data.status).toBe(0);
                expect(data.success.serviceId).not.toBeNull();
                context.serviceId = data.success.serviceId;
                expect(data.success.isPrebookSuccess).not.toBeNull();
                expect(data.success.isPrebookSuccess).toBeTruthy();

                return extApi.book(context.serviceId, bookDTO);
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.success).not.toBeNull();
                expect(data.error).toBeNull();
                expect(data.status).toBe(0);
                expect(data.success.serviceId).not.toBeNull();
                expect(data.success.serviceId).toBe(context.serviceId);
                expect(data.success.status).not.toBeNull();
                expect(data.success.status).toBe("OK");

                done();
            }).catch(function (response) {
                if(response === "WAIT") {
                    return;
                }
                console.error(response);
                fail("Не работает тест на проверку book в ExtAPI!");
                done();
            });

        };

        paginationQuery();
    }, 60000);

    it("check book validation", function(done) {
        var context = {};
        var paginationQuery = function() {
            extApi.search(searchByCityDTO, hotelsUrl).then(function(data) {
                ServiceValidate.validateExtApiSearchResponse(data);

                var searchDone = data.success.done;
                if (!searchDone) {
                    sleep(1500).then(() => {
                        paginationQuery();
                    });
                    throw "WAIT";
                } else {
                    expect(data.success.search).not.toBeNull();
                    expect(data.success.search.length).toBeGreaterThan(0);
                    var hotel = data.success.search[0];
                    expect(hotel.items).not.toBeNull();
                    expect(hotel.items.length).toBeGreaterThan(0);
                    expect(hotel.items[0].length).toBeGreaterThan(0);
                    var room = hotel.items[0][0];
                    expect(room).not.toBeNull();
                    expect(room.commerce).not.toBeNull();
                    expect(room.commerce.offer).not.toBeNull();

                    return extApi.prebook(room.commerce.offer, payer);
                }
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.success).not.toBeNull();
                expect(data.error).toBeNull();
                expect(data.status).toBe(0);
                expect(data.success.serviceId).not.toBeNull();
                context.serviceId = data.success.serviceId;
                expect(data.success.isPrebookSuccess).not.toBeNull();
                expect(data.success.isPrebookSuccess).toBeTruthy();

                const bookDTO = JSON.stringify({
                    tourists: [
                        [
                            {
                                name: {
                                    first: "Extapi",
                                    last: "500"
                                },
                                gender: "male",
                                birthday: 636854400000
                            }
                        ]
                    ]
                });

                return extApi.book(context.serviceId, bookDTO);
            }).then(function(data) {
                CommonValidate.notEmptyObject(data, "data");
                expect(data.status).toBe(7, "Бронь ушла с невалдиным туристом");
                CommonValidate.notEmptyObject(data.error, "error");
                const error = data.error;
                CommonValidate.notEmptyObject(error.name, "error.name");
                CommonValidate.notZero(error.name.last, "error.name.last");
                expect(error.name.last, 12, "У туриста неверная фамилия и должна быть ошибка");

                done();
            }).catch(function (response) {
                if(response === "WAIT") {
                    return;
                }
                console.error(response);
                fail("Не работает тест на проверку валидации в ExtAPI!");
                done();
            });
        };

        paginationQuery();
    }, 60000);

    it("check status", function(done) {
        var context = {};
        var paginationQuery = function() {
            extApi.search(searchByCityDTO, hotelsUrl).then(function(data) {
                ServiceValidate.validateExtApiSearchResponse(data);

                var searchDone = data.success.done;
                if (!searchDone) {
                    sleep(1500).then(() => {
                        paginationQuery();
                    });
                    throw "WAIT";
                } else {
                    expect(data.success.search).not.toBeNull();
                    expect(data.success.search.length).toBeGreaterThan(0);
                    var hotel = data.success.search[0];
                    expect(hotel.items).not.toBeNull();
                    expect(hotel.items.length).toBeGreaterThan(0);
                    expect(hotel.items[0].length).toBeGreaterThan(0);
                    var room = hotel.items[0][0];
                    expect(room).not.toBeNull();
                    expect(room.commerce).not.toBeNull();
                    expect(room.commerce.offer).not.toBeNull();

                    return extApi.prebook(room.commerce.offer, payer);
                }
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.success).not.toBeNull();
                expect(data.error).toBeNull();
                expect(data.status).toBe(0);
                expect(data.success.serviceId).not.toBeNull();
                context.serviceId = data.success.serviceId;
                expect(data.success.isPrebookSuccess).not.toBeNull();
                expect(data.success.isPrebookSuccess).toBeTruthy();
                
                return extApi.book(context.serviceId, bookDTO);
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.success).not.toBeNull();
                expect(data.error).toBeNull();
                expect(data.status).toBe(0);
                expect(data.success.serviceId).not.toBeNull();
                expect(data.success.serviceId).toBe(context.serviceId);
                expect(data.success.status).not.toBeNull();
                expect(data.success.status).toBe("OK");

                return extApi.checkStatus(context.serviceId);
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.success).not.toBeNull();
                expect(data.error).toBeNull();
                expect(data.status).toBe(0);
                expect(data.success.serviceId).not.toBeNull();
                expect(data.success.serviceId).toBe(context.serviceId);
                expect(data.success.status).not.toBeNull();
                expect(data.success.status).toBe("OK");

                done();
            }).catch(function (response) {
                if(response === "WAIT") {
                    return;
                }
                console.error(response);
                fail("Не работает тест на проверку book в ExtAPI!");
                done();
            });
        }

        paginationQuery();
    }, 60000);

    it("cancel", function(done) {
        var context = {};
        var paginationQuery = function() {
            extApi.search(searchByCityDTO, hotelsUrl).then(function(data) {
                ServiceValidate.validateExtApiSearchResponse(data);

                var searchDone = data.success.done;
                if (!searchDone) {
                    sleep(1500).then(() => {
                        paginationQuery();
                    });
                    throw "WAIT";
                } else {
                    expect(data.success.search).not.toBeNull();
                    expect(data.success.search.length).toBeGreaterThan(0);
                    var hotel = data.success.search[0];
                    expect(hotel.items).not.toBeNull();
                    expect(hotel.items.length).toBeGreaterThan(0);
                    expect(hotel.items[0].length).toBeGreaterThan(0);
                    var room = hotel.items[0][0];
                    expect(room).not.toBeNull();
                    expect(room.commerce).not.toBeNull();
                    expect(room.commerce.offer).not.toBeNull();

                    return extApi.prebook(room.commerce.offer, payer);
                }
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.success).not.toBeNull();
                expect(data.error).toBeNull();
                expect(data.status).toBe(0);
                expect(data.success.serviceId).not.toBeNull();
                context.serviceId = data.success.serviceId;
                expect(data.success.isPrebookSuccess).not.toBeNull();
                expect(data.success.isPrebookSuccess).toBeTruthy();

                return extApi.book(context.serviceId, bookDTO);
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.success).not.toBeNull();
                expect(data.error).toBeNull();
                expect(data.status).toBe(0);
                expect(data.success.serviceId).not.toBeNull();
                expect(data.success.serviceId).toBe(context.serviceId);
                expect(data.success.status).not.toBeNull();
                expect(data.success.status).toBe("OK");

                return extApi.checkStatus(context.serviceId);
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.success).not.toBeNull();
                expect(data.error).toBeNull();
                expect(data.status).toBe(0);
                expect(data.success.serviceId).not.toBeNull();
                expect(data.success.serviceId).toBe(context.serviceId);
                expect(data.success.status).not.toBeNull();
                expect(data.success.status).toBe("OK");

                return extApi.cancel(context.serviceId);
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.success).not.toBeNull();
                expect(data.error).toBeNull();
                expect(data.status).toBe(0);
                expect(data.success.serviceId).not.toBeNull();
                expect(data.success.serviceId).toBe(context.serviceId);
                expect(data.success.status).not.toBeNull();
                expect(data.success.status).toBe("CANCELLED");

                done();
            }).catch(function (response) {
                if(response === "WAIT") {
                    return;
                }
                console.error(response);
                fail("Не работает тест на проверку book в ExtAPI!");
                done();
            });
        }

        paginationQuery();
    },  60000);

    it("voucher", function(done) {
        var context = {};
        var paginationQuery = function() {
            extApi.search(searchByCityDTO, hotelsUrl).then(function(data) {
                ServiceValidate.validateExtApiSearchResponse(data);

                var searchDone = data.success.done;
                if (!searchDone) {
                    sleep(1500).then(() => {
                        paginationQuery();
                    });
                    throw "WAIT";
                } else {
                    expect(data.success.search).not.toBeNull();
                    expect(data.success.search.length).toBeGreaterThan(0);
                    var hotel = data.success.search[0];
                    expect(hotel.items).not.toBeNull();
                    expect(hotel.items.length).toBeGreaterThan(0);
                    expect(hotel.items[0].length).toBeGreaterThan(0);
                    var room = hotel.items[0][0];
                    expect(room).not.toBeNull();
                    expect(room.commerce).not.toBeNull();
                    expect(room.commerce.offer).not.toBeNull();

                    return extApi.prebook(room.commerce.offer, payer);
                }
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.success).not.toBeNull();
                expect(data.error).toBeNull();
                expect(data.status).toBe(0);
                expect(data.success.serviceId).not.toBeNull();
                context.serviceId = data.success.serviceId;
                expect(data.success.isPrebookSuccess).not.toBeNull();
                expect(data.success.isPrebookSuccess).toBeTruthy();
                
                return extApi.book(context.serviceId, bookDTO);
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.success).not.toBeNull();
                expect(data.error).toBeNull();
                expect(data.status).toBe(0);
                expect(data.success.serviceId).not.toBeNull();
                expect(data.success.serviceId).toBe(context.serviceId);
                expect(data.success.status).not.toBeNull();
                expect(data.success.status).toBe("OK");

                return extApi.checkStatus(context.serviceId);
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.success).not.toBeNull();
                expect(data.error).toBeNull();
                expect(data.status).toBe(0);
                expect(data.success.serviceId).not.toBeNull();
                expect(data.success.status).not.toBeNull();
                expect(data.success.status).toBe("OK");

                return extApi.voucher(context.serviceId);
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.success).not.toBeNull();
                expect(data.error).toBeNull();
                expect(data.status).toBe(0);
                expect(data.success.url).not.toBeNull();

                done();
            }).catch(function (response) {
                if(response === "WAIT") {
                    return;
                }
                console.error(response);
                fail("Не работает тест на проверку book в ExtAPI!");
                done();
            });
        }

        paginationQuery();
    }, 60000);
});