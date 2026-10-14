# FitForm AI

A college AI/ML prototype that classifies a squat photo into one of three posture categories:
**Good**, **Bad Back**, or **Bad Heel**.

> ⚠️ **This is an experimental student project.**
> The current test accuracy is approximately **37.67%**.
> Predictions are frequently incorrect. Do **not** use this tool for medical advice,
> injury prevention, or training decisions. Always consult a qualified fitness professional.

---

## Project Structure

```
FitForm/
├── static/
│   ├── css/style.css       # All styling
│   └── js/main.js          # Upload, preview, fetch, results
├── templates/
│   └── index.html          # Single-page HTML served by Flask
├── model/
│   └── fitform_ai_model.keras   ← you place this file here (see Step 1)
├── app.py                  # Flask backend
├── requirements.txt        # Python dependencies
└── README.md
```

---

## Step 1 — Export your model from Kaggle

Your model is saved inside the Kaggle notebook at:
```
/kaggle/working/fitform_ai_model.keras
```

**To download it:**

1. Open your Kaggle notebook.
2. Make sure the model was saved with:
   ```python
   model.save("fitform_ai_model.keras")
   ```
3. In the right-hand sidebar, click **Output**.
4. Under `/kaggle/working/`, find `fitform_ai_model.keras`.
5. Click the **↓ download icon** next to the file.
6. Once downloaded, move or copy the file into the `model/` folder of this project:
   ```
   FitForm/model/fitform_ai_model.keras
   ```

> **If you do not see an Output panel:** Run the notebook cell that saves the model,
> wait for it to finish, then refresh the Output panel.

> **If the file is missing from Output:** In Kaggle, output files are only listed if they
> were produced during the most recent run. Re-run all cells (Kernel → Restart & Run All)
> and check again.

---

## Step 2 — Set up a Python virtual environment

Open a terminal / PowerShell in the `FitForm/` folder.

```powershell
# Create a virtual environment named 'venv'
python -m venv venv

# Activate it (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# If you get an execution-policy error, run this first:
# Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

On macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

---

## Step 3 — Install dependencies

With the virtual environment activated:

```bash
pip install -r requirements.txt
```

This installs Flask, TensorFlow, Pillow, and NumPy.
Installation may take a few minutes the first time (TensorFlow is large).

---

## Step 4 — Confirm the model file is in place

```
FitForm/
└── model/
    └── fitform_ai_model.keras   ✅ must exist before you start the server
```

If the file is missing, the server will refuse to start and print a clear error message.

---

## Step 5 — Run the Flask application

```bash
python app.py
```

Expected output:
```
[FitForm AI] Model loaded from model/fitform_ai_model.keras
 * Running on http://127.0.0.1:5000
```

---

## Step 6 — Open in your browser

Navigate to:
```
http://127.0.0.1:5000
```

---

## Step 7 — Test a prediction

1. Click **Choose Image** or drag a squat photo onto the upload area.
2. A preview of the image appears.
3. Click **Analyze Posture**.
4. Wait for the spinner to finish.
5. The result panel shows the predicted class, confidence percentage, and class-specific feedback.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `FileNotFoundError: Model file not found` | Place `fitform_ai_model.keras` in the `model/` folder (Step 1). |
| `ModuleNotFoundError: No module named 'flask'` | Activate your virtual environment and run `pip install -r requirements.txt`. |
| `Could not reach the server` in browser | Make sure `python app.py` is still running in your terminal. |
| Execution-policy error on Windows | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` then re-activate. |
| TensorFlow installation fails | Ensure you are using Python 3.9 – 3.11. TensorFlow does not yet fully support Python 3.12+. |

---

## Model details

| Property | Value |
|---|---|
| Input size | 128 × 128 pixels |
| Input format | RGB, normalised to [0, 1] |
| Output classes | `Bad back`, `Bad heel`, `Good` |
| Framework | TensorFlow / Keras (`.keras` format) |
| Test accuracy | ~37.67% (experimental) |

---

## Disclaimer

This project was built as a college AI/ML assignment. The model is undertrained and the predictions
are unreliable. The feedback shown in the UI is generic educational text only. It does not assess
spinal alignment, diagnose injuries, or replace professional fitness advice.
