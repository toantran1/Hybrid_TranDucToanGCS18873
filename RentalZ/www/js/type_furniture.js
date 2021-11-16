const Furniture = Object.freeze({
    "Unfurnished": 0,
    "Furnished": 1
});

const Type = Object.freeze({
    "Apartment": 0,
    "Penthouse": 1,
    "House": 2,
    "Villa": 3,
    "Studio apartment":4,
    "Bungalow":5,
    "Bedsit":6,
    "Flat":7,
    "Duplexhouse":8
});

// Display messages in the console.
function log(message, type = 'INFO') {
    console.log(`${new Date()} [${type}] ${message}`);
}