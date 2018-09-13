describe("deposit", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    var payment = new Payment(Settings.paymentApiLocation, Settings.apiLocation);
    var cOrderAction = new CommonOrderAction(wsApi, payment);
    var backofficeApi = new BackofficeApi(Settings.backofficeApiLocation);
    var settings = {
        "settings": {
            "lang": "en",
            "payment": "978"
        }
    };

    afterAll(function () {
        wsApi.sendMessage("account", "logout");
        wsApi.close();
    });

    it("add 1 eur", function(done) {
        var context = {};
        context.currency = "EUR";
        wsApi.open({
            open: function () {
                var query = {
                    key: generateUUID(),
                    login: Settings.user.login,
                    pass: Settings.user.pass
                };
                wsApi.sendMessage2("account", "login", query).then(function (data) {
                    expect(data).not.toBeNull();
                    context.startDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
                    return wsApi.sendMessage2("persons", "achips", { num:1, payer:true });
                }).then(function(data) {
                    var payerId = data[0].id;
                    context.eurDeposit = {
                        "978": 1,
                        payer: payerId
                    };
                    return wsApi.sendMessage2("deposit", "add", context.eurDeposit);
                }).then(function (data) {
                    expect(data).not.toBeNull();
                    expect(data.url).not.toBeNull();
                    expect(data.transaction).not.toBeNull();
                    context.trId = data.transaction;
                    return payment.getPaymentDepositInfo(1, context.currency);
                }).then(function (data) {
                    data.transaction = context.trId;
                    return payment.doPay(JSON.stringify(data), true);
                }).then(function (data) {
                    return wsApi.sendMessage2("account", "login", query);
                }).then(function (data) {
                    expect(data).not.toBeNull();
                    var currentDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
                    expect(currentDeposit.amount).toBe(context.startDeposit.amount + 1, "не произошло пополнение депозита на 1 EUR. ожидалось, что при пополнении с фронта на 1 EUR депозит будет увеличен на 1 EUR");
                    done();
                });
            }
        });
    });

    it("add 1 usd", function (done) {
        var context = {};
        context.currency = "USD";
        wsApi.open({
            open: function () {
                var query = {
                    key: generateUUID(),
                    login: Settings.user.login,
                    pass: Settings.user.pass
                };
                wsApi.sendMessage2("account", "login", query).then(function (data) {
                    expect(data).not.toBeNull();
                    backofficeApi.token = data.token;
                return backofficeApi.deleteDeposit(context.currency);
            }).then(function(data){
                return wsApi.sendMessage2("persons", "achips", { num:1, payer:true });
            }).then(function(data) {
                var payerId = data[0].id;
                context.usdDeposit = {
                    "840": 1,
                    payer: payerId
                };
                return wsApi.sendMessage2("deposit", "add", context.usdDeposit);
            }).then(function (data) {
                expect(data).not.toBeNull();
                expect(data.url).not.toBeNull();
                expect(data.transaction).not.toBeNull();
                context.trId = data.transaction;
                return payment.getPaymentDepositInfo(1, context.currency);
            }).then(function (data) {
                data.transaction = context.trId;
                return payment.doPay(JSON.stringify(data), true);
            }).then(function (data) {
                return wsApi.sendMessage2("account", "login", query);
            }).then(function (data) {
                expect(data).not.toBeNull();
                var currentDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "840"))[0];
                expect(currentDeposit.amount).toBe(1, "не произошло пополнение депозита на 1 USD. ожидалось, что после удаления депозита в бэкофисе и его пополнения с фронта на 1 USD депозит будет равен 1 USD");
                done();
            });
            }
        });
    });

    it("retrieve", function(done) {
        var context = {};
        wsApi.open({
            open: function() {
                var query = {
                    key: generateUUID(),
                    login: Settings.user.login,
                    pass: Settings.user.pass
                };
                wsApi.sendMessage2("account", "login", query).then(function(data) {
                    expect(data).not.toBeNull();
                    expect(data.deposit).not.toBeNull();
                    context.deposits = data.deposits;
                }).then(function() {
                    return wsApi.sendMessage2("deposit", "retrieve");
                }).then(function(data) {
                    expect(data).not.toBeNull();
                    var currentEurDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
                    var contextEurDeposit = context.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
                    expect(currentEurDeposit).not.toBeNull();
                    expect(currentEurDeposit.amount).toBe(contextEurDeposit.amount);

                    var currentUsdDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "840"))[0];
                    var contextUsdDeposit = context.deposits.filter(deposit => Object.is(deposit.id, "840"))[0];
                    expect(currentUsdDeposit).not.toBeNull();
                    expect(currentUsdDeposit.amount).toBe(contextUsdDeposit.amount);
                    
                    done();
                });
            }
        });
    });

    it("can be used to pay service", function(done) {
        var queryLogin = {
            key: generateUUID(),
            login: Settings.user.login,
            pass: Settings.user.pass
        };
        var context = {};
        wsApi.open({
            open: function() {
                wsApi.sendMessage2("account", "login", queryLogin).then(function(data) {
                    expect(data).not.toBeNull();
                    context.currentEurDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
                    return wsApi.sendMessage2("settings", "update", settings);
                }).then(function(data) {
                    return wsApi.sendMessage2("persons", "achips", { num:1, payer:true });
                }).then(function(data) {
                    var payerId = data[0].id;
                    var euroDeposit = {
                        "978": 161.11,
                        payer: payerId
                    };
                    return wsApi.sendMessage2("deposit", "add", euroDeposit);
                }).then(function(data) {
                    expect(data).not.toBeNull();
                    expect(data.url).not.toBeNull();
                    expect(data.transaction).not.toBeNull();
                    context.trId = data.transaction;
                    return payment.getPaymentDepositInfo(161.11, "EUR");
                }).then(function(data) {
                    data.transaction = context.trId;
                    return payment.doPay(JSON.stringify(data), true);
                }).then(function(data) {
                    return delay(2000);
                }).then(function(data) {
                    return cOrderAction.createOrderWith1Service(cOrderAction.offer1Dto, "encodehoteloffer", "accommodation", 0, Settings.payerId);
                }).then(function(ct) {
                    return cOrderAction.payServiceDeposit(ct.orderId, ct.serviceId);
                }).then(function(data) {
                    return wsApi.sendMessage2("account", "login", queryLogin);
                }).then(function(data) {
                    expect(data).not.toBeNull();
                    var currentDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
                    expect(currentDeposit.amount).toBe(context.currentEurDeposit.amount);
                    done();
                }).catch(function (response) {
                    console.error(response);
                    fail("Тест на проверку оплаты депозитом не работает!");
                    done();
                });
            }
        });
    }, 30000);
});