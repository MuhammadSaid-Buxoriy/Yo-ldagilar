const tg = window.Telegram.WebApp;
tg.expand();

document.getElementById("username").innerText = tg.initDataUnsafe.user?.first_name || "Foydalanuvchi";

const tasksDiv = document.getElementById("tasks");
for (let i = 1; i <= 10; i++) {
  tasksDiv.innerHTML += `<label><input type="checkbox" name="shart${i}" /> Shart ${i}</label><br>`;
}

document.getElementById("dailyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {};
  for (let i = 1; i <= 10; i++) {
    data[`shart${i}`] = document.querySelector(`[name=shart${i}]`).checked ? 1 : 0;
  }
  data.tg_id = tg.initDataUnsafe.user?.id || "unknown";
  data.name = tg.initDataUnsafe.user?.first_name || "Noma’lum";

  const res = await fetch("https://YOUR_BACKEND_URL/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  document.getElementById("result").innerText =
    "Yuborildi! Kunlik ball: " + result.dailyPoints + " (" + result.percentage + "%)";
});
