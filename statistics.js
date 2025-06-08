const tg = window.Telegram?.WebApp || {
  initDataUnsafe: { user: { id: "demo-id" } },
  expand: () => {},
};

tg.expand();

function updateProgress(idBar, idText, percentage) {
  const bar = document.getElementById(idBar);
  const label = document.getElementById(idText);
  percentage = Math.round(percentage);
  label.innerText = percentage + "%";
  bar.style.width = percentage + "%";

  if (percentage < 50) {
    bar.style.background = "#e74c3c"; // Qizil
  } else if (percentage < 80) {
    bar.style.background = "#e67e22"; // Sabzi
  } else if (percentage < 90) {
    bar.style.background = "#f1c40f"; // Sariq
  } else {
    bar.style.background = "#2ecc71"; // Yashil
  }
}

async function loadStats() {
  try {
    const res = await fetch(`http://localhost:3000/statistics/${tg.initDataUnsafe.user.id}`);
    const data = await res.json();

    updateProgress("daily-bar", "daily-percent", data.percentage);
    updateProgress("weekly-bar", "weekly-percent", data.percentage); // hozircha o‘sha
  } catch (err) {
    document.getElementById("daily-percent").innerText = "⚠️ Xatolik";
    document.getElementById("weekly-percent").innerText = "⚠️";
    console.error("❌ Statistika yuklashda xatolik:", err.message);
  }
}

loadStats();
