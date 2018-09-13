function Payment(paymentHost, apiHost, userLogin = 'resttest', userPass = 'resttest') {
    this.paymentHost = paymentHost;
    this.apiHost = apiHost;
    this.userLogin = userLogin;
    this.userPass = userPass;
}
// TODO: удалить, нужно работать сразу с ссылкой
Payment.prototype.getPaymentServiceInfo = function(serviceId) {
    return $.ajax({
        type: "GET",
        url: this.apiHost + "/api/v2/payment/test/info/service?serviceId=" + serviceId + "&currency=EUR&login=" + this.userLogin +"&pass=" + this.userPass,
        contentType : 'application/json',
        xhrFields: {
            withCredentials: true
        }
    });
};

// TODO: удалить, нужно работать сразу с ссылкой
Payment.prototype.getPaymentOrderInfo = function(orderId) {
    return $.ajax({
        type: "GET",
        url: this.apiHost + "/api/v2/payment/test/info/order?orderId=" + orderId + "&currency=EUR&login=" + this.userLogin + "&pass=" + this.userPass,
        contentType : 'application/json',
        xhrFields: {
            withCredentials: true
        }
    });
};

// TODO: удалить, нужно работать сразу с ссылкой
Payment.prototype.getPaymentDepositInfo = function(amount, currency) {
    return $.ajax({
        type: "GET",
        url: this.apiHost + "/api/v2/payment/test/info/deposit?amount=" + amount + "&currency=" + currency + "&login=" + this.userLogin + "&pass=" + this.userPass + "&paymentSystem=firstpayment",
        contentType : 'application/json',
        xhrFields: {
            withCredentials: true
        }
    });
};

Payment.prototype.doPay = function(paymentInfo, isSuccess) {
    return $.ajax({
        type: "POST",
        url: this.paymentHost + "/api/v2/transaction/test?isSuccess=" + isSuccess,
        data: paymentInfo,
        contentType : 'application/json'
    });
};
