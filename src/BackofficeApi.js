function BackofficeApi(backofficeHost, token) {
    this.backofficeHost = backofficeHost;
    this.token = token;
}
// TODO удалить, нудно работать сразу с сылкой
BackofficeApi.prototype.paymentStatus = function(serviceId) {
    return $.ajax({
        type: "GET",
        url: this.backofficeHost + "/api/v2/service/" + serviceId +"/payments/all",
        headers: {
            'Content-Type':'application/json',
            'X-AUTH-TOKEN' : this.token
        }
    });
};
BackofficeApi.prototype.deleteDeposit = function (currency) {
    return $.ajax({
        type: "DELETE",
        url: this.backofficeHost + "/api/v2/deposit?currency=" + currency,
        headers: {
            'X-AUTH-TOKEN': this.token
        }
    });
};