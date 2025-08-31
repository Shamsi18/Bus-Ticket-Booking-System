function applyPersistedTheme() {
  const t = localStorage.getItem("appTheme");
  if (t === "dark") document.body.classList.add("dark-mode");
}
function t(k){ return (localStorage.getItem("appLanguage")||"en")==="bn" ? bn[k] : en[k]; }
const en = {
  title:"💳 Fake Payment",
  method:"Select Payment Method:",
  tran:"Transaction / Ref:",
  nameon:"Name on Account:",
  confirm:"Confirm Payment",
  cancel:"Cancel",
  demo:"This is a demo payment page. No real payment happens.",
  sum:"Payment Summary",
  route:"Route",
  date:"Date",
  seats:"Seats",
  total:"Total"
};
const bn = {
  title:"💳 ডেমো পেমেন্ট",
  method:"পেমেন্ট মেথড নির্বাচন করুন:",
  tran:"ট্রানজ্যাকশন / রেফ:",
  nameon:"হিসাবের নাম:",
  confirm:"পেমেন্ট নিশ্চিত করুন",
  cancel:"বাতিল",
  demo:"এটি একটি ডেমো পেমেন্ট পেজ। কোনো আসল পেমেন্ট হয় না।",
  sum:"পেমেন্ট সারাংশ",
  route:"রুট",
  date:"তারিখ",
  seats:"সীট",
  total:"মোট"
};

window.addEventListener("load", () => {
  applyPersistedTheme();

  document.getElementById("pay-title").textContent = t("title");
  document.getElementById("method-label").textContent = t("method");
  document.getElementById("tran-label").textContent = t("tran");
  document.getElementById("nameon-label").textContent = t("nameon");
  document.getElementById("confirmBtn").textContent = t("confirm");
  document.getElementById("cancelBtn").textContent = t("cancel");
  document.getElementById("pay-note").textContent = t("demo");

  const pending = JSON.parse(localStorage.getItem("pendingBooking") || "null");
  if (!pending) { window.location.href = "index.html"; return; }

  const sum = document.getElementById("pay-summary");
  sum.innerHTML = `
    <h3>${t("sum")}</h3>
    <p><b>${t("route")}:</b> ${pending.route}</p>
    <p><b>${t("date")}:</b> ${pending.date}</p>
    <p><b>${t("seats")}:</b> ${pending.seats.join(", ")}</p>
    <p><b>${t("total")}:</b> ৳${pending.total}</p>
  `;
});

function cancelPayment(){
  // simply go back to index (pending kept so user can try again or change)
  window.location.href = "index.html";
}

function confirmPayment(){
  const pending = JSON.parse(localStorage.getItem("pendingBooking") || "null");
  if (!pending) { window.location.href = "index.html"; return; }

  // finalize booking: push to bookings[]
  const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
  bookings.push(pending);
  localStorage.setItem("bookings", JSON.stringify(bookings));

  // lock seats for this route+date
  const key = `${pending.route}::${pending.date}`;
  const lockMap = JSON.parse(localStorage.getItem("seatLocks") || "{}");
  const set = new Set(lockMap[key] || []);
  pending.seats.forEach(s => set.add(s));
  lockMap[key] = Array.from(set);
  localStorage.setItem("seatLocks", JSON.stringify(lockMap));

  // clear pending
  localStorage.removeItem("pendingBooking");

  // Generate PDF Ticket
  const doc = {
    content: [
      { text: 'Bus Ticket', style: 'header' },
      { text: `Name: ${pending.user}` },
      { text: `Route: ${pending.route}` },
      { text: `Date: ${pending.date}` },
      { text: `Seats: ${pending.seats.join(", ")}` },
      { text: `Total Paid: ৳${pending.total}` },
      { text: `Ticket ID: ${pending.id}` },
    ],
    styles: { header: { fontSize: 22, bold: true, margin: [0,0,0,10] } }
  };
  pdfMake.createPdf(doc).download('BusTicket.pdf');

  // back to index
  window.location.href = "index.html";
}
