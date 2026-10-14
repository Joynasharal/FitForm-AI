/* FitForm AI – main.js
   Handles: image selection, drag-and-drop, preview, analyze request,
            loading state, results display, error handling, reset.
*/

(function () {
  "use strict";

  // ── DOM references ──────────────────────────────────────────────────────────
  const uploadArea       = document.getElementById("uploadArea");
  const imageInput       = document.getElementById("imageInput");
  const uploadPlaceholder = document.getElementById("uploadPlaceholder");
  const imagePreview     = document.getElementById("imagePreview");
  const chooseBtn        = document.getElementById("chooseBtn");
  const analyzeBtn       = document.getElementById("analyzeBtn");
  const loadingState     = document.getElementById("loadingState");
  const resultsPanel     = document.getElementById("resultsPanel");
  const resultClass      = document.getElementById("resultClass");
  const confidenceFill   = document.getElementById("confidenceFill");
  const confidenceValue  = document.getElementById("confidenceValue");
  const feedbackBox      = document.getElementById("feedbackBox");
  const resetBtn         = document.getElementById("resetBtn");

  // Error container – created dynamically and appended once
  let errorContainer = null;

  // The currently selected File object
  let selectedFile = null;

  // ── Class-specific feedback ──────────────────────────────────────────────────
  // Cautious, non-diagnostic wording. Does NOT claim to assess spinal alignment
  // or diagnose injuries.
  const FEEDBACK = {
    "Good": {
      cssClass: "good",
      label: "✅ Good",
      message:
        "The model classified this image in the <strong>Good</strong> category based on patterns " +
        "it learned during training. This is a general observation — it does not confirm that your " +
        "squat form is safe or optimal. If you are new to squatting, consider learning with a " +
        "coach or certified trainer."
    },
    "Bad back": {
      cssClass: "bad-back",
      label: "⚠️ Bad Back",
      message:
        "The model classified this image in the <strong>Bad Back</strong> category. This class was " +
        "associated with certain back-rounding patterns in the training data. This is a rough pattern " +
        "match, not a diagnosis. A rounded back during squats can increase load on the spine for some " +
        "people — if this is a concern, consult a fitness professional for hands-on guidance."
    },
    "Bad heel": {
      cssClass: "bad-heel",
      label: "⚠️ Bad Heel",
      message:
        "The model classified this image in the <strong>Bad Heel</strong> category. This class was " +
        "associated with heel-lifting patterns in the training data. Raised heels can affect balance " +
        "and load distribution during a squat. This is a rough pattern match — it does not confirm " +
        "any injury risk. A fitness professional can give personalised advice."
    }
  };

  // Fallback if the server returns an unexpected class name
  function getFeedback(className) {
    return FEEDBACK[className] || {
      cssClass: "",
      label: className,
      message: "The model returned an unrecognised class. Please check the server configuration."
    };
  }

  // ── Utility: show / hide element ────────────────────────────────────────────
  function show(el) { el.classList.remove("hidden"); }
  function hide(el) { el.classList.add("hidden"); }

  // ── Error display ────────────────────────────────────────────────────────────
  function showError(message) {
    if (!errorContainer) {
      errorContainer = document.createElement("div");
      errorContainer.className = "error-msg";
      // Insert after the button row
      analyzeBtn.parentElement.insertAdjacentElement("afterend", errorContainer);
    }
    errorContainer.textContent = message;
    show(errorContainer);
  }

  function clearError() {
    if (errorContainer) hide(errorContainer);
  }

  // ── Image selection & preview ────────────────────────────────────────────────
  function handleFile(file) {
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/bmp"];
    if (!allowed.includes(file.type)) {
      showError("Unsupported file type. Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    clearError();
    selectedFile = file;

    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreview.src = e.target.result;
      show(imagePreview);
      hide(uploadPlaceholder);
      analyzeBtn.disabled = false;

      // Hide previous results when a new image is chosen
      hide(resultsPanel);
      hide(loadingState);
    };
    reader.readAsDataURL(file);
  }

  // Click on upload area → trigger file input
  uploadArea.addEventListener("click", function () {
    imageInput.click();
  });

  // Dedicated "Choose Image" button
  chooseBtn.addEventListener("click", function () {
    imageInput.click();
  });

  // File input change
  imageInput.addEventListener("change", function () {
    if (this.files && this.files[0]) {
      handleFile(this.files[0]);
    }
  });

  // ── Drag and drop ────────────────────────────────────────────────────────────
  uploadArea.addEventListener("dragover", function (e) {
    e.preventDefault();
    uploadArea.classList.add("drag-over");
  });

  uploadArea.addEventListener("dragleave", function () {
    uploadArea.classList.remove("drag-over");
  });

  uploadArea.addEventListener("drop", function (e) {
    e.preventDefault();
    uploadArea.classList.remove("drag-over");
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  // ── Analyze ──────────────────────────────────────────────────────────────────
  analyzeBtn.addEventListener("click", async function () {
    if (!selectedFile) return;

    clearError();
    hide(resultsPanel);
    show(loadingState);
    analyzeBtn.disabled = true;

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch("/predict", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      hide(loadingState);

      if (!response.ok) {
        // Server returned an error (4xx / 5xx)
        showError("Server error: " + (data.error || "Unknown error. Check the terminal for details."));
        analyzeBtn.disabled = false;
        return;
      }

      displayResults(data);

    } catch (err) {
      hide(loadingState);
      showError(
        "Could not reach the server. Make sure Flask is running on http://127.0.0.1:5000 " +
        "and try again. (" + err.message + ")"
      );
      analyzeBtn.disabled = false;
    }
  });

  // ── Display results ──────────────────────────────────────────────────────────
 
function displayResults(data) {
  const fb = getFeedback(data.class);
  const pct = Math.round((data.confidence || 0) * 100);

  // Low confidence should not be presented as a definite "Good" result.
  const isLowConfidence = pct < 50;
  const displayLabel = isLowConfidence
    ? "⚖️ Moderate"
    : fb.label;

  const displayClass = isLowConfidence
    ? "moderate"
    : fb.cssClass;

  // Result label and color
  resultClass.textContent = displayLabel;
  resultClass.className = "result-class " + displayClass;

  // Confidence percentage
  confidenceFill.style.width = "0%";
  confidenceFill.style.backgroundColor =
    pct < 50 ? "#f59e0b" :
    pct < 70 ? "#facc15" :
    "#22c55e";

  confidenceValue.textContent = pct + "%";

  // Explain low-confidence results honestly
  if (isLowConfidence) {
    feedbackBox.textContent =
      `The model's prediction is uncertain (${pct}% confidence). ` +
      `The highest-scoring category was "${data.class}", but this ` +
      `prototype is displaying Moderate because confidence is low. ` +
      `This does not confirm that your squat form is safe or correct.`;
  } else {
    feedbackBox.innerHTML = fb.message;
  }

  feedbackBox.className = "feedback-box " + displayClass;

  show(resultsPanel);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      confidenceFill.style.width = pct + "%";
    });
  });

  analyzeBtn.disabled = false;
  resultsPanel.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}


  // ── Reset ────────────────────────────────────────────────────────────────────
  resetBtn.addEventListener("click", function () {
    selectedFile = null;
    imageInput.value = "";
    imagePreview.src = "";
    hide(imagePreview);
    show(uploadPlaceholder);
    hide(resultsPanel);
    hide(loadingState);
    clearError();
    analyzeBtn.disabled = true;
    uploadArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

})();
