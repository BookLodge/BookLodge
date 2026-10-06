const mapLocationSearchResponse = (response) => ({
  locations: response.data.map((place) => ({
    placeId: place.placeId,
    name: place.displayName,
    address: place.formattedAddress,
  })),
});

module.exports = { mapLocationSearchResponse };
