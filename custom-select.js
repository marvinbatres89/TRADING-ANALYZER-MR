(function () {
  "use strict";
  const SELECT_IDS = ["marketSelect", "strategySelect", "modeSelect"];

  const STRATEGY_BADGES = {
    rise_fall: "RF",
    even_odd: "EO",
    over_under: "OU",
    match: "MA",
    boom: "BM",
    crash: "CR"
  };

  function badgeFor(nativeSelect, option) {
    if (nativeSelect.id === "strategySelect") {
      return STRATEGY_BADGES[option.value] || option.value.slice(0, 2).toUpperCase();
    }

    if (nativeSelect.id === "marketSelect") {
      const label = option.textContent || "";
      const numberMatch = label.match(/(\d+)/);
      const isFast = /\(1s\)/i.test(label);
      return numberMatch ? `${numberMatch[1]}${isFast ? "s" : ""}` : "--";
    }

    return (option.textContent || "").slice(0, 2).toUpperCase();
  }

  function closeAll(except = null) {
    document.querySelectorAll(".custom-select-shell.open").forEach((shell) => {
      if (shell === except) return;
      shell.classList.remove("open");
      shell.querySelector(".custom-select-trigger")?.setAttribute("aria-expanded", "false");
    });
  }

  function buildOptions(nativeSelect, panel, triggerText) {
    panel.innerHTML = "";
    [...nativeSelect.options].forEach((option) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "custom-select-option";
      item.setAttribute("role", "option");
      item.dataset.value = option.value;

      const family = option.dataset.marketFamily;
      if (family) item.classList.add(`market-${family}`);
      if (nativeSelect.id === "strategySelect" && option.value === "boom") {
        item.classList.add("strategy-boom");
      }
      if (nativeSelect.id === "strategySelect" && option.value === "crash") {
        item.classList.add("strategy-crash");
      }
      if (nativeSelect.id === "marketSelect") {
        const label = option.textContent || "";
        if (/^R_\d+$/.test(option.value)) item.classList.add("market-standard");
        else if (/^1HZ\d+V$/.test(option.value) || /\(1s\)/i.test(label)) item.classList.add("market-1s");
        else if (/boom/i.test(label)) item.classList.add("market-boom");
        else if (/crash/i.test(label)) item.classList.add("market-crash");
        else item.classList.add("market-other");
      }

      const text = document.createElement("span");
      text.className = "custom-select-option-text";
      text.textContent = option.textContent;

      const badge = document.createElement("span");
      badge.className = "select-badge";
      badge.textContent = badgeFor(nativeSelect, option);
      badge.setAttribute("aria-hidden", "true");

      const indicator = document.createElement("span");
      indicator.className = "custom-select-radio";
      indicator.setAttribute("aria-hidden", "true");
      item.append(badge, text, indicator);

      const sync = () => {
        const selected = nativeSelect.value === option.value;
        item.classList.toggle("selected", selected);
        item.setAttribute("aria-selected", String(selected));
        if (selected) {
          triggerText.textContent = option.textContent;
          const triggerBadge = panel.closest(".custom-select-shell")?.querySelector(".select-badge.trigger-badge");
          if (triggerBadge) triggerBadge.textContent = badge.textContent;
        }
      };

      item.addEventListener("click", () => {
        nativeSelect.value = option.value;
        nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        panel.closest(".custom-select-shell")?.classList.remove("open");
        panel.closest(".custom-select-shell")
          ?.querySelector(".custom-select-trigger")
          ?.setAttribute("aria-expanded", "false");
      });

      nativeSelect.addEventListener("change", sync);
      sync();
      panel.appendChild(item);
    });

    triggerText.textContent =
      nativeSelect.options[nativeSelect.selectedIndex]?.textContent || "Seleccione";
  }

  function enhance(nativeSelect) {
    if (!nativeSelect || nativeSelect.dataset.enhanced === "true") return;
    nativeSelect.dataset.enhanced = "true";
    nativeSelect.classList.add("native-select-hidden");

    const shell = document.createElement("div");
    shell.className = "custom-select-shell";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "custom-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    const triggerBadge = document.createElement("span");
    triggerBadge.className = "select-badge trigger-badge";
    triggerBadge.setAttribute("aria-hidden", "true");
    const triggerText = document.createElement("span");
    triggerText.className = "custom-select-trigger-text";
    const arrow = document.createElement("span");
    arrow.className = "custom-select-arrow";
    arrow.setAttribute("aria-hidden", "true");
    trigger.append(triggerBadge, triggerText, arrow);

    const panel = document.createElement("div");
    panel.className = "custom-select-panel";
    panel.setAttribute("role", "listbox");

    nativeSelect.parentNode.insertBefore(shell, nativeSelect.nextSibling);
    shell.append(trigger, panel);
    buildOptions(nativeSelect, panel, triggerText);

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      if (nativeSelect.disabled) return;
      const open = !shell.classList.contains("open");
      closeAll(shell);
      shell.classList.toggle("open", open);
      trigger.setAttribute("aria-expanded", String(open));
    });

    nativeSelect.addEventListener("optionsupdated", () => {
      buildOptions(nativeSelect, panel, triggerText);
    });

    const observer = new MutationObserver(() => {
      shell.classList.toggle("disabled", nativeSelect.disabled);
      trigger.disabled = nativeSelect.disabled;
    });
    observer.observe(nativeSelect, { attributes: true, attributeFilter: ["disabled"] });

    shell.classList.toggle("disabled", nativeSelect.disabled);
    trigger.disabled = nativeSelect.disabled;
  }

  document.addEventListener("click", () => closeAll());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAll();
  });

  const init = () => SELECT_IDS.forEach((id) => enhance(document.getElementById(id)));
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
