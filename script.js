// ===== Utilities & State =====
const seatsContainer = document.getElementById("busLayout");
const summaryDiv = document.getElementById("summary");
const welcomeText = document.getElementById("welcome");

const langKey = "appLanguage";
const themeKey = "appTheme";
let language = localStorage.getItem(langKey) || "en";

// ===== Student-only Reserved Seats =====
const studentOnlySeats = ["A1","A2","B1","B2"]; // 4 seats reserved for students

// ===== Login Gate =====
window.addEventListener("load", () => {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }
  welcomeText.innerHTML = (language === "bn" ? "স্বাগতম, " : "Welcome, ") + `<b>${user.name}</b>`;
  applyPersistedTheme();
  applyPersistedLanguage();

  ensureRouteHasDefaultBuses("Dhaka → Pabna");
  ensureRouteHasDefaultBuses("Dhaka → Jhenaidah");

  buildBusLayout();
  showSummary();
  refreshSeatLocks();

  // render buses list with rating
  renderBuses("Dhaka → Pabna", document.getElementById("busList"));
});

// ===== Build Real Bus Layout (2x2 with aisle) =====
function buildBusLayout() {
  seatsContainer.innerHTML = "";
  const rows = 8;
  const rowLetters = "ABCDEFGH".split("");
  for (let r = 0; r < rows; r++) {
    const row = document.createElement("div");
    row.className = "row";
    const s1 = makeSeat(`${rowLetters[r]}1`);
    const s2 = makeSeat(`${rowLetters[r]}2`);
    const aisle = document.createElement("div");
    aisle.className = "aisle";
    const s3 = makeSeat(`${rowLetters[r]}3`);
    const s4 = makeSeat(`${rowLetters[r]}4`);

    [s1, s2, s3, s4].forEach(seatEl => {
      if (studentOnlySeats.includes(seatEl.textContent)) {
        seatEl.classList.add("student-seat");
      }
    });

    row.append(s1, s2, aisle, s3, s4);
    seatsContainer.appendChild(row);
  }
}

function makeSeat(label) {
  const d = document.createElement("div");
  d.className = "seat";
  d.textContent = label;
  d.addEventListener("click", () => {
    const isStudent = document.getElementById("student").value === "yes";
    if (studentOnlySeats.includes(label) && !isStudent) {
      alert(language==="bn"?"এই সীটটি শুধুমাত্র ছাত্রদের জন্য সংরক্ষিত।":"This seat is reserved for students only.");
      return;
    }
    if (!d.classList.contains("booked")) d.classList.toggle("selected");
  });
  return d;
}

// ===== Theme & Language =====
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem(themeKey, isDark ? "dark" : "light");
}
function applyPersistedTheme() {
  const t = localStorage.getItem(themeKey);
  if (t === "dark") document.body.classList.add("dark-mode");
}

function switchLanguage() {
  language = language === "en" ? "bn" : "en";
  localStorage.setItem(langKey, language);
  applyPersistedLanguage();
}
function applyPersistedLanguage() {
  const texts = {
    en: {
      title: "🚌 Bus Ticket Booking",
      route: "Choose Route:",
      date: "Select Date:",
      student: "Are you a student?",
      coupon: "Coupon Code:",
      seat: "Select Seats:",
      history: "Booking History",
      nobook: "No booking yet.",
      proceed: "Proceed to Payment"
    },
    bn: {
      title: "🚌 বাস টিকেট বুকিং",
      route: "রুট নির্বাচন করুন:",
      date: "তারিখ নির্বাচন করুন:",
      student: "আপনি কি ছাত্র?",
      coupon: "কুপন কোড:",
      seat: "সীট নির্বাচন করুন:",
      history: "বুকিং ইতিহাস",
      nobook: "এখনও কোনো বুকিং নেই।",
      proceed: "পেমেন্টে যান"
    }
  };
  const t = texts[language];
  document.getElementById("title").textContent = t.title;
  document.getElementById("route-label").textContent = t.route;
  document.getElementById("date-label").textContent = t.date;
  document.getElementById("student-label").textContent = t.student;
  document.getElementById("coupon-label").textContent = t.coupon;
  document.getElementById("seat-label").textContent = t.seat;
  document.getElementById("history-label").textContent = t.history;
  const nb = document.getElementById("no-booking");
  if (nb) nb.textContent = t.nobook;
  document.getElementById("proceedBtn").textContent = t.proceed;
}

// ===== Route/Date Helpers =====
function getCurrentRouteAndPrice() {
  const [routeText, priceStr] = document.getElementById("route").value.split("|");
  return { routeText, price: parseInt(priceStr) };
}
function currentKey() {
  const { routeText } = getCurrentRouteAndPrice();
  const date = document.getElementById("date").value || "__NO_DATE__";
  return `${routeText}::${date}`;
}

// ===== Seat Availability (by route+date) =====
function refreshSeatLocks() {
  const key = currentKey();
  const lockMap = JSON.parse(localStorage.getItem("seatLocks") || "{}");
  const lockedSeats = lockMap[key] || [];
  document.querySelectorAll(".seat").forEach(seat => {
    seat.classList.remove("booked", "selected");
    if (lockedSeats.includes(seat.textContent)) seat.classList.add("booked");
  });
}
function lockSeatsForKey(key, seatNames) {
  const lockMap = JSON.parse(localStorage.getItem("seatLocks") || "{}");
  const set = new Set(lockMap[key] || []);
  seatNames.forEach(s => set.add(s));
  lockMap[key] = Array.from(set);
  localStorage.setItem("seatLocks", JSON.stringify(lockMap));
}
function unlockSeatsForKey(key, seatNames) {
  const lockMap = JSON.parse(localStorage.getItem("seatLocks") || "{}");
  const current = new Set(lockMap[key] || []);
  seatNames.forEach(s => current.delete(s));
  lockMap[key] = Array.from(current);
  localStorage.setItem("seatLocks", JSON.stringify(lockMap));
}

// ===== Proceed to Payment =====
function proceedPayment() {
  const date = document.getElementById("date").value;
  if (!date) { alert(language==="bn"?"তারিখ নির্বাচন করুন!":"Please select a date!"); return; }

  const selectedSeats = Array.from(document.querySelectorAll(".seat.selected")).map(s => s.textContent);
  if (!selectedSeats.length) { alert(language==="bn"?"সীট নির্বাচন করুন!":"Select at least one seat!"); return; }

  const isStudent = document.getElementById("student").value === "yes";
  if (!isStudent && selectedSeats.some(s => studentOnlySeats.includes(s))) {
    alert(language==="bn"?"আপনি ছাত্র না হওয়ায় নির্ধারিত সীট নির্বাচন করতে পারবেন না।":"You cannot book student-reserved seats.");
    return;
  }

  const { price, routeText } = getCurrentRouteAndPrice();
  let total = price * selectedSeats.length;

  // NEW FEATURE: AC Bus extra charge
  const selectedBus = document.getElementById("busList").value;
  if (selectedBus && selectedBus.includes("AC")) {
    total += 200 * selectedSeats.length; // 200 Taka extra per seat for AC bus
  }

  if (isStudent) total *= 0.8; // 20% student
  const coupon = document.getElementById("coupon").value.trim();
  if (coupon === "DISCOUNT20") total *= 0.8;

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const pending = {
    id: Date.now(),
    user: user.name,
    route: routeText,
    date,
    seats: selectedSeats,
    total: Math.round(total),
    coupon: coupon || null,
    busType: selectedBus // NEW: Store bus type for history
  };
  localStorage.setItem("pendingBooking", JSON.stringify(pending));
  window.location.href = "payment.html";
}

// ===== History =====
function showSummary() {
  const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const userBookings = bookings.filter(b => b.user === user.name);

  summaryDiv.innerHTML = `<h3 id="history-label">${language==="bn"?"বুকিং ইতিহাস":"Booking History"}</h3>`;
  if (!userBookings.length) {
    const p = document.createElement("p");
    p.id = "no-booking";
    p.textContent = language==="bn"?"এখনও কোনো বুকিং নেই।":"No booking yet.";
    summaryDiv.appendChild(p);
    return;
  }
  userBookings.forEach(b => {
    const div = document.createElement("div");
    div.className = "summary";
    div.style.background = "transparent";
    div.innerHTML = `
      <p><b>Route:</b> ${b.route}</p>
      <p><b>Date:</b> ${b.date}</p>
      <p><b>Seats:</b> ${b.seats.join(", ")}</p>
      <p><b>Bus Type:</b> ${b.busType || 'N/A'}</p>
      <p><b>Total:</b> ৳${b.total}</p>
      <button class="btn small-btn ghost" onclick="cancelBooking(${b.id})">${language==="bn"?"ক্যান্সেল":"Cancel"}</button>
    `;
    summaryDiv.appendChild(div);
  });
}
function cancelBooking(id) {
  let bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
  const toCancel = bookings.find(b => b.id === id);
  if (!toCancel) return;
  const key = `${toCancel.route}::${toCancel.date}`;
  unlockSeatsForKey(key, toCancel.seats);
  bookings = bookings.filter(b => b.id !== id);
  localStorage.setItem("bookings", JSON.stringify(bookings));
  showSummary();
  refreshSeatLocks();
}

// ===== Logout =====
function logoutUser() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
}

/* ======================
   🚍 New Features Below
====================== */
// ===== Default Buses (4 per route) =====
const BUS_STORAGE_KEY = "busRoutes_v1";
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function getRoutes() {
  return loadJSON(BUS_STORAGE_KEY, {});
}
function setRoutes(routes) {
  saveJSON(BUS_STORAGE_KEY, routes);
}

// NEW: Route-specific bus names
function ensureRouteHasDefaultBuses(routeName) {
  const routes = getRoutes();
  if (!routes[routeName] || routes[routeName].length === 0) {
    // Different bus names for each route
    if (routeName === "Dhaka → Pabna") {
      routes[routeName] = [
        { id: `${routeName}-B1`, name: "Pabna Express", type: "Non-AC", time: "08:00 AM" },
        { id: `${routeName}-B2`, name: "Pabna Express", type: "Non-AC", time: "12:00 PM" },
        { id: `${routeName}-B3`, name: "Pabna Express", type: "Non-AC", time: "04:00 PM" },
        { id: `${routeName}-B4`, name: "Pabna Express", type: "AC", time: "08:30 PM" },
      ];
    } else if (routeName === "Dhaka → Jhenaidah") {
      routes[routeName] = [
        { id: `${routeName}-B1`, name: "Jhenaidah Express", type: "Non-AC", time: "08:00 AM" },
        { id: `${routeName}-B2`, name: "Jhenaidah Express", type: "Non-AC", time: "12:00 PM" },
        { id: `${routeName}-B3`, name: "Jhenaidah Express", type: "Non-AC", time: "04:00 PM" },
        { id: `${routeName}-B4`, name: "Jhenaidah Express", type: "AC", time: "08:30 PM" },
      ];
    } else {
      // Default for any other routes
      routes[routeName] = [
        { id: `${routeName}-B1`, name: `${routeName} Express`, type: "Non-AC", time: "08:00 AM" },
        { id: `${routeName}-B2`, name: `${routeName} Express`, type: "Non-AC", time: "12:00 PM" },
        { id: `${routeName}-B3`, name: `${routeName} Express`, type: "Non-AC", time: "04:00 PM" },
        { id: `${routeName}-B4`, name: `${routeName} Express`, type: "AC", time: "08:30 PM" },
      ];
    }
    setRoutes(routes);
  }
  return routes[routeName];
}

// NEW: Render buses with names and types
function renderBuses(routeName, container) {
  const buses = ensureRouteHasDefaultBuses(routeName);
  container.innerHTML = "";
  
  buses.forEach(bus => {
    const option = document.createElement("option");
    option.value = `${bus.name} (${bus.type}) - ${bus.time}`;
    option.textContent = `${bus.name} (${bus.type}) - ${bus.time}`;
    container.appendChild(option);
  });
}

// Update bus list when route changes
document.getElementById("route").addEventListener("change", function() {
  const routeName = this.value.split("|")[0];
  renderBuses(routeName, document.getElementById("busList"));
});

const stars = document.querySelectorAll("#ratingStars span");
const result = document.getElementById("ratingResult");
const route = "Dhaka → Pabna"; // Example route, route অনুযায়ী পরিবর্তন করো

// show existing rating
function showRating(route) {
  const data = JSON.parse(localStorage.getItem("rating_" + route));
  if(data && data.count > 0){
    const avg = (data.total / data.count).toFixed(1);
    result.innerText = `Average Rating: ⭐ ${avg} (${data.count} votes)`;
  } else {
    result.innerText = "No rating yet.";
  }
}

// Submit feedback
function submitFeedback() {
  const text = document.getElementById("feedbackText").value.trim();
  if(!text) { alert("Please write feedback!"); return; }

  const user = JSON.parse(localStorage.getItem("loggedInUser")) || { name: "Guest" };
  const route = document.getElementById("route").value.split("|")[0]; // feedback per route

  const key = "feedback_" + route;
  const existing = JSON.parse(localStorage.getItem(key)) || [];

  existing.push({
    user: user.name,
    text,
    time: new Date().toLocaleString()
  });

  localStorage.setItem(key, JSON.stringify(existing));
  document.getElementById("feedbackText").value = "";
  showFeedback(route);
}

// Show feedback history
function showFeedback(route) {
  const key = "feedback_" + route;
  const feedbacks = JSON.parse(localStorage.getItem(key)) || [];
  const container = document.getElementById("feedbackHistory");
  container.innerHTML = "";

  if(feedbacks.length === 0) {
    container.innerHTML = "<p>No feedback yet.</p>";
    return;
  }

  feedbacks.forEach(fb => {
    const div = document.createElement("div");
    div.style.border = "1px solid #ccc";
    div.style.padding = "8px";
    div.style.marginBottom = "6px";
    div.style.borderRadius = "6px";
    div.innerHTML = `<b>${fb.user}</b> <i>(${fb.time})</i><br>${fb.text}`;
    container.appendChild(div);
  });
}

// Initialize feedback for selected route
document.getElementById("route").addEventListener("change", () => {
  const route = document.getElementById("route").value.split("|")[0];
  showFeedback(route);
});

// Initial load
showFeedback(document.getElementById("route").value.split("|")[0]);