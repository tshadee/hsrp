// Variable Binder - Lightweight attachment script for cfg pages
// This script automatically discovers HTML inputs and binds them to exposed JS variables
console.log("Variable Binder attached for:", contentId);

// Wait a bit for the page to fully load
setTimeout(() => {
  bindVariables();
}, 100);

function bindVariables() {
  const exposedVars = window.ExposedVars;

  if (!exposedVars || exposedVars.size === 0) {
    console.log("No exposed variables found");
    return;
  }

  console.log(`Found ${exposedVars.size} exposed variables`);

  const inputs = document.querySelectorAll("input, select, textarea");
  const displays = document.querySelectorAll("[data-display]");

  inputs.forEach((input) => {
    bindInputElement(input, exposedVars);
  });

  displays.forEach((display) => {
    bindDisplayElement(display, exposedVars);
  });

  const dataVarElements = document.querySelectorAll("[data-var]");
  dataVarElements.forEach((element) => {
    bindDataVarElement(element, exposedVars);
  });
}

function bindInputElement(input, exposedVars) {
  // Try to determine variable name from various attributes
  let varName =
    input.getAttribute("data-var") || input.getAttribute("name") || input.id;

  // Convert kebab-case or camelCase to the format we might have
  const possibleNames = generatePossibleNames(varName);

  let matchedVar = null;
  let matchedKey = null;

  for (const name of possibleNames) {
    if (exposedVars.has(name)) {
      matchedVar = exposedVars.get(name);
      matchedKey = name;
      break;
    }
  }

  if (!matchedVar) {
    return; // No matching variable found
  }

  console.log(
    `Binding input ${input.id || input.name} to variable ${matchedKey}`
  );

  // Set initial value
  const currentValue = matchedVar.get();
  setInputValue(input, currentValue, matchedVar.type);

  // Apply constraints if they exist
  applyInputConstraints(input, matchedVar);

  // Listen for changes
  const eventType = getInputEventType(input);
  input.addEventListener(eventType, (e) => {
    const newValue = getInputValue(input, matchedVar.type);
    try {
      matchedVar.set(newValue);
      console.log(`Set ${matchedKey} = ${newValue}`);

      // Update any display elements
      updateDisplayElements(matchedKey, newValue);
    } catch (error) {
      console.error(`Error setting ${matchedKey}:`, error);
    }
  });

  // Mark as bound to avoid double-binding
  input.setAttribute("data-bound", matchedKey);
}

function bindDisplayElement(display, exposedVars) {
  const varName = display.getAttribute("data-display");
  const possibleNames = generatePossibleNames(varName);

  let matchedVar = null;
  let matchedKey = null;

  for (const name of possibleNames) {
    if (exposedVars.has(name)) {
      matchedVar = exposedVars.get(name);
      matchedKey = name;
      break;
    }
  }

  if (!matchedVar) {
    return;
  }

  console.log(
    `Binding display ${display.id || "element"} to variable ${matchedKey}`
  );

  // Set initial display value
  const currentValue = matchedVar.get();
  display.textContent = formatDisplayValue(currentValue, matchedVar.type);

  // Store reference for updates
  display.setAttribute("data-bound-display", matchedKey);
}

function bindDataVarElement(element, exposedVars) {
  const varName = element.getAttribute("data-var");
  const possibleNames = generatePossibleNames(varName);

  let matchedVar = null;
  let matchedKey = null;

  for (const name of possibleNames) {
    if (exposedVars.has(name)) {
      matchedVar = exposedVars.get(name);
      matchedKey = name;
      break;
    }
  }

  if (!matchedVar) {
    return;
  }

  // Handle different element types
  if (element.tagName.toLowerCase() === "input") {
    bindInputElement(element, exposedVars);
  } else {
    // Treat as display element
    console.log(
      `Binding data-var display ${
        element.id || "element"
      } to variable ${matchedKey}`
    );
    const currentValue = matchedVar.get();
    element.textContent = formatDisplayValue(currentValue, matchedVar.type);
    element.setAttribute("data-bound-display", matchedKey);
  }
}

function generatePossibleNames(baseName) {
  if (!baseName) return [];

  const variations = [baseName];

  // Convert kebab-case to camelCase
  if (baseName.includes("-")) {
    const camelCase = baseName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    variations.push(camelCase);
  }

  // Convert camelCase to kebab-case
  if (baseName.match(/[A-Z]/)) {
    const kebabCase = baseName.replace(
      /[A-Z]/g,
      (letter) => `-${letter.toLowerCase()}`
    );
    variations.push(kebabCase);
  }

  // Try with underscores
  variations.push(baseName.replace(/-/g, "_"));
  variations.push(baseName.replace(/_/g, "-"));

  return [...new Set(variations)]; // Remove duplicates
}

function setInputValue(input, value, type) {
  switch (input.type) {
    case "checkbox":
      input.checked = Boolean(value);
      break;
    case "range":
    case "number":
      input.value = Number(value);
      break;
    case "color":
      input.value = String(value);
      break;
    default:
      input.value = String(value);
  }
}

function getInputValue(input, type) {
  switch (input.type) {
    case "checkbox":
      return input.checked;
    case "range":
    case "number":
      return Number(input.value);
    case "color":
      return input.value;
    default:
      // Auto-detect type if not specified
      if (type === "number" || !isNaN(Number(input.value))) {
        return Number(input.value);
      }
      return input.value;
  }
}

function getInputEventType(input) {
  switch (input.type) {
    case "range":
      return "input"; // Real-time updates for sliders
    case "checkbox":
      return "change";
    case "color":
      return "input";
    default:
      return "input";
  }
}

function applyInputConstraints(input, varConfig) {
  if (input.type === "number" || input.type === "range") {
    if (varConfig.min !== undefined) {
      input.min = varConfig.min;
    }
    if (varConfig.max !== undefined) {
      input.max = varConfig.max;
    }
    if (varConfig.step !== undefined) {
      input.step = varConfig.step;
    }
  }
}

function formatDisplayValue(value, type) {
  switch (type) {
    case "number":
      return Number(value).toFixed(2);
    case "boolean":
      return value ? "Enabled" : "Disabled";
    default:
      return String(value);
  }
}

function updateDisplayElements(varKey, newValue) {
  const displays = document.querySelectorAll(
    `[data-bound-display="${varKey}"]`
  );
  displays.forEach((display) => {
    const varConfig = window.ExposedVars.get(varKey);
    display.textContent = formatDisplayValue(newValue, varConfig.type);
  });
}

// Cleanup function for when content changes
// Check if onCleanup is available (it should be in the wrapper context)
if (typeof onCleanup === "function") {
  onCleanup(() => {
    console.log("Variable Binder cleanup");
  });
} else {
  console.log(
    "onCleanup not available - cleanup will be handled by content loader"
  );
}
