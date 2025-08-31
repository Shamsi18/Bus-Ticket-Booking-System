function loginUser() {
  let email = document.getElementById("email").value.trim().toLowerCase();
  let password = document.getElementById("password").value;

  let users = JSON.parse(localStorage.getItem("users")) || [];
  let user = users.find(u => u.email === email && u.password === password);

  if (user) {
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    window.location.href = "index.html";
  } else {
    alert("Invalid email or password!");
  }
}
