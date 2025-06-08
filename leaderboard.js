const tg = window.Telegram.WebApp;
tg.expand();

const container = document.getElementById("leaderboard-list");

fetch("http://localhost:3000/leaderboard") // backenddagi endpoint
  .then(res => res.json())
  .then(data => {
    data.sort((a, b) => b.percentage - a.percentage); // yuqoridan pastga

    data.forEach((user, index) => {
      const percent = Math.round(user.percentage);
      const color =
        percent < 50 ? "#e74c3c" :  // qizil
        percent < 80 ? "#e67e22" :  // sabzi
        percent < 90 ? "#f1c40f" :  // sariq
                       "#2ecc71";   // yashil

      const el = document.createElement("div");
      el.className = "leaderboard-item";
      el.innerHTML = `
        <div class="rank">#${index + 1}</div>
        <div class="info">
          <strong>${user.name}</strong>
          <div class="progress-wrapper">
            <div class="progress-bar" style="width: ${percent}%; background: ${color};"></div>
          </div>
        </div>
        <div class="percent">${percent}%</div>
      `;
      container.appendChild(el);
    });
  })
  .catch(() => {
    container.innerHTML = "<p>Xatolik yuz berdi</p>";
  });
