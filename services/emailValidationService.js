const emailValidationService = (email) => {
    const emailRegext = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegext.test(email);
}
export default emailValidationService;