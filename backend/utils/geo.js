function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function segmentLengths(coords) {
  const lens = [];
  for (let i = 0; i < coords.length - 1; i++) lens.push(haversine(coords[i], coords[i + 1]));
  return lens;
}

/** Position (lat, lon) at fraction t (0..1) along a coords polyline, weighted by real distance. */
function positionAt(coords, t) {
  const lens = segmentLengths(coords);
  const total = lens.reduce((a, b) => a + b, 0);
  let target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < lens.length; i++) {
    if (target <= lens[i] || i === lens.length - 1) {
      const segT = lens[i] === 0 ? 0 : Math.min(1, target / lens[i]);
      const [lat1, lon1] = coords[i];
      const [lat2, lon2] = coords[i + 1];
      return { lat: lat1 + (lat2 - lat1) * segT, lon: lon1 + (lon2 - lon1) * segT, segIndex: i };
    }
    target -= lens[i];
  }
  const last = coords[coords.length - 1];
  return { lat: last[0], lon: last[1], segIndex: coords.length - 2 };
}

module.exports = { haversine, segmentLengths, positionAt };
