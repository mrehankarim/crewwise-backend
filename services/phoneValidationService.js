class phoneValidationService {

    static normalizePhone(phone) {
        return phone.replace(/\s|-/g, "").trim();
    }

    static validate(phone) {
        const normalized = this.normalizePhone(phone);
        const phoneRegex = /^\+[1-9]\d{7,14}$/;

        if (!phoneRegex.test(normalized)) {
            return {
                valid: false,
                message: "Invalid Phone Number"
            };
        }
        return {
            valid: true,
            phone: normalized,
        }

    }


}

export default phoneValidationService;