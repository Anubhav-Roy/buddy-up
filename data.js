// Static lists used across buddyup. People, trips and reviews live in Firebase (see db.js).
window.BuddyData = (function () {
  const INTERESTS = [
    "Street food", "Museums", "Nightlife", "Hiking", "Photography", "Coffee",
    "Live music", "Architecture", "Markets", "Art", "History", "Beaches",
    "Craft beer", "Vegan eats", "Shopping", "Cycling",
  ];

  const LANGUAGES = ["English", "Spanish", "French", "Hindi", "German", "Japanese", "Portuguese", "Italian", "Mandarin", "Arabic"];

  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const addDays = (d, n) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() + n); return x; };

  return { INTERESTS, LANGUAGES, ymd, addDays };
})();
