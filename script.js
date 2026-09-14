// ============================================================
// SOLAR MONITOR - SISTEMA DE SIMULAÇÃO FOTOVOLTAICA
// ============================================================

const state = {
  scenario: "clean",

  irradiance: 812,
  voltage: 20.12,
  current: 4.72,
  power: 94.9,
  temperature: 46.3,
  performance: 82,

  cleaning: false,
  cleaningProgress: 0,

  history: {
    labels: [],
    power: [],
    current: [],
    temperature: [],
    irradiance: []
  }
};

// ============================================================
// CONFIGURAÇÃO DOS CENÁRIOS
// ============================================================

const scenarios = {
  clean: {
    name: "PAINEL LIMPO",
    irradiance: 850,
    voltage: 20.5,
    current: 5.0,
    temperature: 43,
    performance: 100,
    efficiency: 1
  },

  light: {
    name: "SUJEIRA LEVE",
    irradiance: 760,
    voltage: 20.1,
    current: 4.45,
    temperature: 45,
    performance: 88,
    efficiency: 0.88
  },

  moderate: {
    name: "SUJEIRA MODERADA",
    irradiance: 640,
    voltage: 19.6,
    current: 3.65,
    temperature: 48,
    performance: 70,
    efficiency: 0.70
  },

  intense: {
    name: "SUJEIRA INTENSA",
    irradiance: 470,
    voltage: 18.7,
    current: 2.65,
    temperature: 53,
    performance: 48,
    efficiency: 0.48
  },

  shadow: {
    name: "SOMBREAMENTO",
    irradiance: 310,
    voltage: 17.9,
    current: 1.75,
    temperature: 49,
    performance: 31,
    efficiency: 0.31
  }
};

// ============================================================
// ELEMENTOS DO DOM
// ============================================================

const irradianciaValue = document.getElementById("irradianciaValue");
const tensaoValue = document.getElementById("tensaoValue");
const correnteValue = document.getElementById("correnteValue");
const potenciaValue = document.getElementById("potenciaValue");
const temperaturaValue = document.getElementById("temperaturaValue");
const desempenhoValue = document.getElementById("desempenhoValue");

const systemStatus = document.getElementById("systemStatus");
const cleaningStatus = document.getElementById("cleaningStatus");
const cleaningProgress = document.getElementById("cleaningProgress");
const cleaningBtn = document.getElementById("cleaningBtn");
const eventLog = document.getElementById("eventLog");

const currentDateTime = document.getElementById("currentDateTime");

const scenarioButtons = document.querySelectorAll(".scenario-btn");

// ============================================================
// GRÁFICOS
// ============================================================

const chartConfig = {
  responsive: true,
  maintainAspectRatio: false,

  animation: {
    duration: 300
  },

  plugins: {
    legend: {
      display: false
    }
  },

  scales: {
    x: {
      ticks: {
        maxTicksLimit: 8
      }
    },

    y: {
      beginAtZero: true
    }
  }
};

const powerChart = new Chart(
  document.getElementById("powerChart"),
  {
    type: "line",

    data: {
      labels: [],
      datasets: [
        {
          label: "Potência",
          data: [],
          borderWidth: 2,
          tension: 0.35,
          fill: true
        }
      ]
    },

    options: chartConfig
  }
);

const currentChart = new Chart(
  document.getElementById("currentChart"),
  {
    type: "line",

    data: {
      labels: [],
      datasets: [
        {
          label: "Corrente",
          data: [],
          borderWidth: 2,
          tension: 0.35,
          fill: true
        }
      ]
    },

    options: chartConfig
  }
);

const temperatureChart = new Chart(
  document.getElementById("temperatureChart"),
  {
    type: "line",

    data: {
      labels: [],
      datasets: [
        {
          label: "Temperatura",
          data: [],
          borderWidth: 2,
          tension: 0.35,
          fill: true
        }
      ]
    },

    options: chartConfig
  }
);

const irradianceChart = new Chart(
  document.getElementById("irradianceChart"),
  {
    type: "line",

    data: {
      labels: [],
      datasets: [
        {
          label: "Irradiância",
          data: [],
          borderWidth: 2,
          tension: 0.35,
          fill: true
        }
      ]
    },

    options: chartConfig
  }
);

// ============================================================
// UTILIDADES
// ============================================================

function randomVariation(value, percentage = 0.03) {
  const variation = value * percentage;

  return value + (Math.random() * variation * 2 - variation);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatTime() {
  const now = new Date();

  return now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function updateClock() {
  const now = new Date();

  currentDateTime.textContent = now.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

// ============================================================
// ATUALIZAÇÃO DOS VALORES
// ============================================================

function updateMetrics() {
  irradianciaValue.textContent =
    `${Math.round(state.irradiance)} W/m²`;

  tensaoValue.textContent =
    `${state.voltage.toFixed(2)} V`;

  correnteValue.textContent =
    `${state.current.toFixed(2)} A`;

  potenciaValue.textContent =
    `${state.power.toFixed(1)} W`;

  temperaturaValue.textContent =
    `${state.temperature.toFixed(1)} °C`;

  desempenhoValue.textContent =
    `${Math.round(state.performance)}%`;
}

// ============================================================
// SIMULAÇÃO DOS DADOS
// ============================================================

function simulateData() {
  if (state.cleaning) {
    return;
  }

  const scenario = scenarios[state.scenario];

  // Pequenas variações naturais
  state.irradiance = randomVariation(
    scenario.irradiance,
    0.035
  );

  state.voltage = randomVariation(
    scenario.voltage,
    0.015
  );

  state.current = randomVariation(
    scenario.current,
    0.04
  );

  state.temperature = randomVariation(
    scenario.temperature,
    0.025
  );

  // Pequena influência da temperatura
  const temperatureFactor =
    1 - Math.max(0, state.temperature - 25) * 0.002;

  state.power =
    state.voltage *
    state.current *
    temperatureFactor;

  // Desempenho baseado no cenário
  state.performance =
    scenario.performance +
    (Math.random() * 4 - 2);

  // Limites
  state.irradiance = clamp(
    state.irradiance,
    0,
    1200
  );

  state.voltage = clamp(
    state.voltage,
    0,
    25
  );

  state.current = clamp(
    state.current,
    0,
    8
  );

  state.temperature = clamp(
    state.temperature,
    20,
    80
  );

  state.performance = clamp(
    state.performance,
    0,
    100
  );

  state.power = clamp(
    state.power,
    0,
    150
  );

  updateMetrics();
  updateSystemStatus();
  updateCharts();
}

// ============================================================
// STATUS DO SISTEMA
// ============================================================

function updateSystemStatus() {
  if (state.cleaning) {
    systemStatus.className =
      "system-status status-normal";

    systemStatus.textContent =
      "🔵 LIMPEZA DO SISTEMA EM ANDAMENTO";

    return;
  }

  if (state.scenario === "clean") {
    systemStatus.className =
      "system-status status-normal";

    systemStatus.textContent =
      "🟢 SISTEMA OPERANDO NORMALMENTE";

    return;
  }

  if (state.scenario === "light") {
    systemStatus.className =
      "system-status status-warning";

    systemStatus.textContent =
      "🟡 SUJEIRA LEVE DETECTADA";

    return;
  }

  if (state.scenario === "moderate") {
    systemStatus.className =
      "system-status status-warning";

    systemStatus.textContent =
      "🟠 REDUÇÃO DE DESEMPENHO DETECTADA";

    return;
  }

  if (state.scenario === "intense") {
    systemStatus.className =
      "system-status status-danger";

    systemStatus.textContent =
      "🔴 SUJEIRA INTENSA — LIMPEZA RECOMENDADA";

    return;
  }

  if (state.scenario === "shadow") {
    systemStatus.className =
      "system-status status-danger";

    systemStatus.textContent =
      "🌑 SOMBREAMENTO DETECTADO";

    return;
  }
}

// ============================================================
// GRÁFICOS
// ============================================================

function updateCharts() {
  const time = formatTime();

  state.history.labels.push(time);
  state.history.power.push(Number(state.power.toFixed(1)));
  state.history.current.push(Number(state.current.toFixed(2)));
  state.history.temperature.push(
    Number(state.temperature.toFixed(1))
  );
  state.history.irradiance.push(
    Math.round(state.irradiance)
  );

  // Mantém somente os últimos 30 pontos
  if (state.history.labels.length > 30) {
    state.history.labels.shift();
    state.history.power.shift();
    state.history.current.shift();
    state.history.temperature.shift();
    state.history.irradiance.shift();
  }

  powerChart.data.labels = state.history.labels;
  powerChart.data.datasets[0].data =
    state.history.power;

  currentChart.data.labels = state.history.labels;
  currentChart.data.datasets[0].data =
    state.history.current;

  temperatureChart.data.labels =
    state.history.labels;

  temperatureChart.data.datasets[0].data =
    state.history.temperature;

  irradianceChart.data.labels =
    state.history.labels;

  irradianceChart.data.datasets[0].data =
    state.history.irradiance;

  powerChart.update();
  currentChart.update();
  temperatureChart.update();
  irradianceChart.update();
}

// ============================================================
// EVENTOS
// ============================================================

function addEvent(message, type = "normal") {
  const li = document.createElement("li");

  li.className = `event-item event-${type}`;

  li.innerHTML = `
    <span class="event-time">${formatTime()}</span>
    <span class="event-message">${message}</span>
  `;

  eventLog.prepend(li);

  // Limita o histórico a 15 eventos
  while (eventLog.children.length > 15) {
    eventLog.removeChild(eventLog.lastChild);
  }
}

// ============================================================
// SELEÇÃO DE CENÁRIO
// ============================================================

scenarioButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (state.cleaning) {
      addEvent(
        "Não é possível alterar o cenário durante a limpeza.",
        "warning"
      );

      return;
    }

    const scenarioName =
      button.dataset.scenario;

    state.scenario = scenarioName;

    // Atualiza botão ativo
    scenarioButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    const scenario =
      scenarios[scenarioName];

    // Inicializa os valores imediatamente
    state.irradiance = scenario.irradiance;
    state.voltage = scenario.voltage;
    state.current = scenario.current;
    state.temperature = scenario.temperature;
    state.performance = scenario.performance;

    state.power =
      state.voltage * state.current;

    updateMetrics();
    updateSystemStatus();

    addEvent(
      `Cenário alterado para: ${scenario.name}`,
      scenarioName === "clean"
        ? "normal"
        : "warning"
    );
  });
});

// ============================================================
// SISTEMA DE LIMPEZA
// ============================================================

cleaningBtn.addEventListener("click", () => {
  if (state.cleaning) {
    return;
  }

  // Se o painel já estiver limpo
  if (state.scenario === "clean") {
    cleaningStatus.textContent =
      "Painel já está limpo";

    addEvent(
      "Solicitação de limpeza ignorada: painel já está limpo.",
      "normal"
    );

    return;
  }

  startCleaning();
});

function startCleaning() {
  state.cleaning = true;
  state.cleaningProgress = 0;

  cleaningBtn.disabled = true;

  cleaningBtn.textContent =
    "⏳ LIMPEZA EM ANDAMENTO...";

  cleaningStatus.textContent =
    "Preparando sistema de limpeza...";

  cleaningProgress.style.width = "0%";

  updateSystemStatus();

  addEvent(
    "Limpeza autorizada pelo operador.",
    "normal"
  );

  const cleaningInterval =
    setInterval(() => {
      state.cleaningProgress +=
        Math.random() * 8 + 4;

      if (state.cleaningProgress >= 100) {
        state.cleaningProgress = 100;

        clearInterval(cleaningInterval);

        finishCleaning();

        return;
      }

      cleaningProgress.style.width =
        `${state.cleaningProgress}%`;

      cleaningStatus.textContent =
        `Limpando painel... ${Math.round(
          state.cleaningProgress
        )}%`;
    }, 500);
}

function finishCleaning() {
  cleaningProgress.style.width = "100%";

  cleaningStatus.textContent =
    "✅ Limpeza concluída com sucesso";

  addEvent(
    "Limpeza concluída. Eficiência do painel restaurada.",
    "normal"
  );

  // Retorna para painel limpo
  state.scenario = "clean";

  scenarioButtons.forEach((btn) => {
    btn.classList.remove("active");

    if (btn.dataset.scenario === "clean") {
      btn.classList.add("active");
    }
  });

  state.irradiance =
    scenarios.clean.irradiance;

  state.voltage =
    scenarios.clean.voltage;

  state.current =
    scenarios.clean.current;

  state.temperature =
    scenarios.clean.temperature;

  state.performance =
    scenarios.clean.performance;

  state.power =
    state.voltage * state.current;

  state.cleaning = false;

  cleaningBtn.disabled = false;

  cleaningBtn.textContent =
    "🧹 AUTORIZAR LIMPEZA";

  updateMetrics();
  updateSystemStatus();

  // Limpa depois de alguns segundos
  setTimeout(() => {
    cleaningStatus.textContent =
      "Sistema pronto para nova análise";

    cleaningProgress.style.width = "0%";
  }, 2500);
}

// ============================================================
// NAVEGAÇÃO
// ============================================================

const navLinks =
  document.querySelectorAll(".nav-link");

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.forEach((item) => {
      item.classList.remove("active");
    });

    link.classList.add("active");
  });
});

// Detecta automaticamente a seção visível
const sections =
  document.querySelectorAll(
    "main section[id]"
  );

const observer =
  new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.remove("active");

            if (
              link.getAttribute("href") ===
              `#${entry.target.id}`
            ) {
              link.classList.add("active");
            }
          });
        }
      });
    },
    {
      threshold: 0.3
    }
  );

sections.forEach((section) => {
  observer.observe(section);
});

// ============================================================
// INICIALIZAÇÃO
// ============================================================

function initialize() {
  updateClock();
  updateMetrics();
  updateSystemStatus();

  // Cria dados iniciais para os gráficos
  for (let i = 0; i < 10; i++) {
    simulateData();
  }

  addEvent(
    "Sistema iniciado em modo de simulação.",
    "normal"
  );

  addEvent(
    "Monitoramento fotovoltaico iniciado.",
    "normal"
  );
}

initialize();

// Atualiza relógio
setInterval(updateClock, 1000);

// Atualiza sensores
setInterval(simulateData, 1500);