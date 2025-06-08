// Telegram WebApp bo‘lmasa ham test qilish uchun fallback
const tg = window.Telegram?.WebApp || {
    initDataUnsafe: {
      user: { id: "demo-id", first_name: "Foydalanuvchi" }
    },
    expand: () => {},
    showAlert: alert
  };
  
  tg.expand();
  
  document.addEventListener("DOMContentLoaded", () => {
    const taskList = document.getElementById("task-list");
    const submitBtn = document.getElementById("submitBtn");
    const form = document.getElementById("form");
    const pagesInput = document.getElementById("pages_read");
    const distanceInput = document.getElementById("distance_km");
  
    const taskNames = [
      "KUNLIK VIRD (ZIKR, QUR'ON, IBODAT)",
      "SILAI RAHM (OTA-ONA VA QARINDOSHLAR)",
      "QUR'ON TINGLASH (1/114)",
      "EHSON QILISH (1000 SO'M +)",
      "KITOB O‘QISH (10 betdan ko‘p)", // shart_5
      "DARS (KURS) (BIROR DARS BOSHLASH)",
      "AUDIO KITOB / PODCAST (KAMIDA YARIM SOAT)",
      "ERTAROQ UXLASH (21:00 - 23:00)",
      "ERTAROQ UYG‘ONISH (03:00 - 06:00)",
      "SPORT VA MASHQLAR (YUGURISH / SAYR QILISH)" // shart_10
    ];
  
    const state = {};
  
    // Har bir shartni render qilish
    function renderTasks() {
      taskNames.forEach((label, i) => {
        const index = i + 1;
        const div = document.createElement("div");
        div.innerHTML = `
          <label>
            <input type="checkbox" name="shart_${index}" onchange="handleCheck(${index})" />
            ${label}
          </label>
        `;
        taskList.appendChild(div);
      });
    }
  
    // Checkbox belgilansa
    window.handleCheck = function (index) {
      state[`shart_${index}`] = !state[`shart_${index}`];
      const showPages = state["shart_5"];
      const showDistance = state["shart_10"];
  
      document.getElementById("extra-inputs").style.display = showPages || showDistance ? "block" : "none";
      document.getElementById("pages-block").style.display = showPages ? "block" : "none";
      document.getElementById("distance-block").style.display = showDistance ? "block" : "none";
      validateForm();
    };
  
    // Tugmani faollashtirish
    function validateForm() {
      const hasSelected = Object.values(state).some(Boolean);
      const pagesValid = !state["shart_5"] || (pagesInput.value && pagesInput.value > 0);
      const distanceValid = !state["shart_10"] || (distanceInput.value && distanceInput.value > 0);
      submitBtn.disabled = !(hasSelected && pagesValid && distanceValid);
    }
  
    pagesInput.addEventListener("input", validateForm);
    distanceInput.addEventListener("input", validateForm);
  
    // Formani yuborish
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const body = {
        tg_id: tg.initDataUnsafe.user.id,
        name: tg.initDataUnsafe.user.first_name,
        pages_read: pagesInput.value || "0",
        distance_km: distanceInput.value || "0"
      };
  
      for (let i = 1; i <= 10; i++) {
        body[`shart_${i}`] = state[`shart_${i}`] ? 1 : 0;
      }
  
      try {
        const res = await fetch("http://localhost:3000/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        tg.showAlert(`✅ Ball: ${data.totalPoints} | ${data.percentage}%`);
      } catch (err) {
        tg.showAlert("❌ Xatolik yuz berdi. Iltimos qayta urinib ko‘ring.");
      }
    });
  
    // Barchasini boshlash
    renderTasks();
  });
  