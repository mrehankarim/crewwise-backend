class apiResponse {
    constructor(
        statusCode,
        data = null,
        message = "Success"
    ) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = true;
    }
}

export default apiResponse;
