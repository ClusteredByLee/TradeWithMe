
const apiKey = "1070ba3e301c46d8b67ef7b827747309";
let chart;

document.getElementById("symbol-select").addEventListener("change", () => {
  loadChart();
});

async function loadChart() {
  const symbol = document.getElementById("symbol-select").value.replace("/", "");
  const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&apikey=${apiKey}&outputsize=50`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data || !data.values) return;

  const labels = data.values.map(d => d.datetime).reverse();
  const prices = data.values.map(d => parseFloat(d.close)).reverse();

  const signals = generateSignals(prices);
  showSignals(signals);

  const ctx = document.getElementById("priceChart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Price",
        data: prices,
        borderColor: "cyan",
        borderWidth: 2,
        fill: false,
      }]
    }
  });
}

function generateSignals(prices) {
  const last = prices[prices.length - 1];
  const rsi = calcRSI(prices);
  const macd = calcMACD(prices);
  const maShort = calcMA(prices, 5);
  const maLong = calcMA(prices, 20);

  let score = 0;
  if (rsi < 30) score++;
  if (macd.histogram > 0) score++;
  if (maShort > maLong) score++;

  if (score === 3) return { type: "Strong Buy" };
  if (score === 2) return { type: "Buy" };
  if (rsi > 70 && macd.histogram < 0 && maShort < maLong) return { type: "Strong Sell" };
  return { type: "Hold" };
}

function showSignals(signal) {
  const div = document.getElementById("signals");
  div.innerHTML = "";
  const alert = document.createElement("div");
  alert.className = "alert";
  if (signal.type.includes("Strong")) alert.classList.add("strong");
  alert.textContent = `Signal: ${signal.type}`;
  div.appendChild(alert);
}

function calcMA(prices, len) {
  const slice = prices.slice(-len);
  return slice.reduce((a, b) => a + b, 0) / len;
}

function calcRSI(prices) {
  let gains = 0, losses = 0;
  for (let i = 1; i < 15; i++) {
    let diff = prices[prices.length - i] - prices[prices.length - i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let rs = gains / (losses || 1);
  return 100 - 100 / (1 + rs);
}

function calcMACD(prices) {
  const ema12 = calcEMA(prices, 12);
  const ema26 = calcEMA(prices, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calcEMA(macdLine, 9);
  const histogram = macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1];
  return { histogram };
}

function calcEMA(data, period) {
  const k = 2 / (period + 1);
  const ema = [];
  let sum = data.slice(0, period).reduce((a, b) => a + b, 0);
  ema[period - 1] = sum / period;
  for (let i = period; i < data.length; i++) {
    ema[i] = data[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

loadChart();
