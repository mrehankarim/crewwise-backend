import app from "./app.js";
import connectDB from "./config/db.js";

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        })
    })
    .catch((error) => {
        console.log(`MongoDB connection error ${error}`);
    })


