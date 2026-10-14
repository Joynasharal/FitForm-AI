import os
import numpy as np
from flask import Flask, request, jsonify, render_template
from PIL import Image
import io

app = Flask(__name__)

# --- Model configuration ---
MODEL_PATH = os.path.join("model", "fitform_ai_model.keras")
IMG_SIZE = (128, 128)
# Class order must exactly match the training label encoding
CLASS_NAMES = ["Bad back", "Bad heel", "Good"]

model = None


def load_model():
    """Load the Keras model once at startup."""
    global model
    # Import here so startup fails clearly if TensorFlow is not installed
    from tensorflow import keras  # noqa: PLC0415
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model file not found at '{MODEL_PATH}'. "
            "Please download fitform_ai_model.keras from Kaggle and place it "
            "in the 'model/' folder. See README.md for instructions."
        )
    model = keras.models.load_model(MODEL_PATH)
    print(f"[FitForm AI] Model loaded from {MODEL_PATH}")


def preprocess_image(file_bytes: bytes) -> np.ndarray:
    """
    Preprocess an uploaded image to match training conditions:
    - Convert to RGB
    - Resize to 128 × 128
    - Normalise pixel values to [0, 1]
    - Add batch dimension
    """
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE)
    arr = np.array(img, dtype=np.float32)
    return np.expand_dims(arr, axis=0)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model is not loaded. Check server logs."}), 503

    if "image" not in request.files:
        return jsonify({"error": "No image file received."}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename. Please select an image."}), 400

    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        return jsonify({"error": f"Unsupported file type '{ext}'. Use JPG, PNG, or WebP."}), 400

    try:
        file_bytes = file.read()
        input_tensor = preprocess_image(file_bytes)
    except Exception as exc:
        return jsonify({"error": f"Could not read image: {exc}"}), 422

    try:
        predictions = model.predict(input_tensor, verbose=0)  # shape: (1, 3)
    except Exception as exc:
        return jsonify({"error": f"Prediction failed: {exc}"}), 500

    probabilities = predictions[0].tolist()
    predicted_index = int(np.argmax(probabilities))
    predicted_class = CLASS_NAMES[predicted_index]
    confidence = float(probabilities[predicted_index])

    return jsonify({
        "class": predicted_class,
        "confidence": round(confidence, 4),
        "all_scores": {CLASS_NAMES[i]: round(probabilities[i], 4) for i in range(len(CLASS_NAMES))}
    })


if __name__ == "__main__":
    load_model()
    # debug=False keeps output clean; set to True only during development
    app.run(debug=True, host="127.0.0.1", port=5000)
