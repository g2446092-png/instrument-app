// ===========================
//  Sound Board – Fun Add-ons
//  ③ 称号システム / ④ 隠しコマンド
// ===========================

const buttons = Array.from(document.querySelectorAll(".sound-button"));
const rankEl = document.getElementById("rank");
const countEl = document.getElementById("tapCount");
const secretMsgEl = document.getElementById("secret-msg");
const appRoot = document.querySelector(".instrument-app");

// audio要素はHTMLの id="sound1" ~ "sound6" を利用
function playByDataSound(ds) {
  const audioId = ds; // "sound1" など
  const audio = document.getElementById(audioId);
  if (!audio) return;
  // 同時再生を許可（重ね押しOK）
  try {
    audio.currentTime = 0;
    audio.play();
  } catch (e) {
    // autoplay制限等
  }
}

// 押した時のビジュアル（.is-playing を短時間付与）
function blip(btn) {
  btn.classList.add("is-playing");
  // 音の長さに依存させず一律でオフ。短め演出ならOK
  setTimeout(() => btn.classList.remove("is-playing"), 350);
}

// ===== ③ 称号システム =====
const TITLE_STEPS = [
  { threshold: 0,   title: "見習いタッパー Lv.1" },
  { threshold: 10,  title: "新人タップ職人" },
  { threshold: 30,  title: "中級パーカッショナー" },
  { threshold: 50,  title: "連打界の貴公子" },
  { threshold: 100, title: "神の指（保証外）" },
];

function getTitleForCount(n) {
  let current = TITLE_STEPS[0].title;
  for (const step of TITLE_STEPS) {
    if (n >= step.threshold) current = step.title;
  }
  return current;
}

// セッション継続：ローカル保存（任意でオフにしてOK）
const STORAGE_KEY = "fun-soundboard-total-taps";
let totalTaps = Number(localStorage.getItem(STORAGE_KEY) || 0);
updateHUD();

function addTap() {
  totalTaps += 1;
  localStorage.setItem(STORAGE_KEY, String(totalTaps));
  updateHUD();
}

function updateHUD() {
  const title = getTitleForCount(totalTaps);
  if (rankEl) rankEl.innerHTML = `称号：<strong>${title}</strong>`;
  if (countEl) countEl.textContent = `総タップ：${totalTaps}`;
}

// ===== ④ 隠しコマンド（入力シーケンス検出） =====
// 秘密の順番：sound2 → sound5 → sound1
const SECRET_CODE = ["sound2", "sound5", "sound1"];
const buffer = [];
const MAX_BUFFER = SECRET_CODE.length;

function pushBuffer(token) {
  buffer.push(token);
  if (buffer.length > MAX_BUFFER) buffer.shift();

  // 末尾がコードと一致？
  if (buffer.length === MAX_BUFFER && SECRET_CODE.every((v, i) => v === buffer[i])) {
    triggerSecret();
    buffer.length = 0; // リセット
  }
}

let secretCooldown = false;

function triggerSecret() {
  if (secretCooldown) return; // 連続発動防止
  secretCooldown = true;

  // メッセージ表示
  if (secretMsgEl) {
    secretMsgEl.hidden = false;
    secretMsgEl.classList.add("show");
  }

  // 全ボタンをチカチカ＆全音同時発音（派手演出）
  appRoot?.classList.add("easter-egg");
  buttons.forEach((btn, idx) => {
    // フラッシュ用クラス
    btn.classList.add("flash");
    // ずらし再生で気持ちいい演出
    setTimeout(() => {
      const ds = btn.getAttribute("data-sound");
      if (ds) playByDataSound(ds);
      blip(btn);
    }, 80 * idx);
  });

  // 後片付け
  setTimeout(() => {
    buttons.forEach(btn => btn.classList.remove("flash"));
    appRoot?.classList.remove("easter-egg");
    if (secretMsgEl) {
      secretMsgEl.classList.remove("show");
      secretMsgEl.hidden = true;
    }
    secretCooldown = false;
  }, 2200);
}

// ===== イベント結線 =====
buttons.forEach((btn) => {
  const ds = btn.getAttribute("data-sound"); // "sound1" など
  btn.addEventListener("click", () => {
    if (!ds) return;
    playByDataSound(ds);
    blip(btn);
    addTap();
    pushBuffer(ds);
  });

  // キーボード操作対応（Enter/Spaceで押下）
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      btn.click();
    }
  });
});
