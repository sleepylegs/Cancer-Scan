// Roboflow Model Details (replace with your actual key if different, but this is the one you provided)
const ROBOTFLOW_API_KEY = 'rf_dqDbILKhaEMFeRG4AC8EQYkAxl33';
const MODEL_ID = 'brainmri_classification/1'; // Your model ID and version

// Get DOM Elements
const uploadArea = document.getElementById('uploadArea');
const imageUpload = document.getElementById('imageUpload');
const uploadButton = document.getElementById('uploadButton');
const uploadedImage = document.getElementById('uploadedImage');
const imagePreview = document.getElementById('imagePreview');
const predictionResult = document.getElementById('predictionResult');
const aiReview = document.getElementById('aiReview');
const loadingSpinner = document.getElementById('loadingSpinner');

let roboflowModel; // To store the initialized Roboflow model

// Initialize Roboflow.js


// Call initialization when the script loads
//initializeRoboflow();

// --- Event Listeners for File Upload ---

// Click "Click to Upload" button
uploadButton.addEventListener('click', () => {
  imageUpload.click(); // Trigger the hidden file input
});

// Handle file selection via input
imageUpload.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    handleFile(file);
  }
});

// Handle drag over for styling
uploadArea.addEventListener('dragover', (event) => {
  event.preventDefault();
  uploadArea.classList.add('drag-over');
});

// Handle drag leave for styling
uploadArea.addEventListener('dragleave', (event) => {
  event.preventDefault();
  uploadArea.classList.remove('drag-over');
});

// Handle drop event
uploadArea.addEventListener('drop', (event) => {
  event.preventDefault();
  uploadArea.classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file) {
    handleFile(file);
  }
});

// --- Core Logic for Image Handling and Prediction ---

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // Only data after comma
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


async function predictWithRoboflowAPI(base64Image) {
  const response = await fetch(
    'https://classify.roboflow.com/brainmri_classification/1?api_key=OgC3ItbaT46SvzYTwQAJ',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `image=${base64Image}`
    }
  );
  return await response.json(); // Note: Still check for !response.ok to catch errors
}


async function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file (e.g., JPG, PNG).');
    return;
  }

  predictionResult.textContent = 'Analyzing...';
  aiReview.textContent = 'Please wait while the AI processes the image.';
  uploadedImage.style.display = 'none';
  loadingSpinner.style.display = 'flex';

  try {
    const base64Image = await fileToBase64(file);

    // Set preview
    uploadedImage.src = 'data:image/*;base64,' + base64Image;
    uploadedImage.style.display = 'block';

    // Make API request
    const prediction = await predictWithRoboflowAPI(base64Image);
    displayPrediction(prediction);
  } catch (error) {
    predictionResult.textContent = 'Error: Could not get prediction.';
    aiReview.textContent = 'There was an issue processing the image. Please try again.';
    console.error(error);
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

function displayPrediction(prediction) {
  let predictedClass = '';
  let confidence = 0;

  // Prefer API 'top' and 'confidence' fields for classification endpoint
  if (prediction && prediction.top && prediction.confidence !== undefined) {
    predictedClass = prediction.top;
    confidence = (prediction.confidence * 100).toFixed(2);
  }
  // Fallback for older API shape
  else if (
    prediction &&
    prediction.predictions &&
    prediction.predictions.length > 0
  ) {
    const bestPrediction = prediction.predictions.reduce((prev, current) =>
      prev.confidence > current.confidence ? prev : current
    );
    predictedClass = bestPrediction.class;
    confidence = (bestPrediction.confidence * 100).toFixed(2);
  }

  if (predictedClass) {
    predictionResult.innerHTML = `<strong>${predictedClass}</strong> (Confidence: ${confidence}%)`;

    let reviewText =
      'Please consult a medical professional for a definitive diagnosis and treatment plan. This AI prediction is for informational purposes only and is not a substitute for professional medical advice.';

    switch (predictedClass.toLowerCase()) {
      case 'glioma':
        reviewText +=
          " Gliomas are a type of tumor that starts in the brain or spinal cord. It's crucial to seek immediate medical attention for further investigation and treatment.";
        break;
      case 'meningioma':
        reviewText +=
          ' Meningiomas are tumors that arise from the membranes that surround the brain and spinal cord. While often benign, they can still cause symptoms and may require medical evaluation and monitoring.';
        break;
      case 'pituitary':
        reviewText +=
          ' Pituitary tumors occur in the pituitary gland at the base of the brain. They can affect hormone levels and may require specialized medical consultation and management.';
        break;
      case 'notumor':
        reviewText +=
          " The scan appears to indicate no tumor. However, always remember that an AI model cannot replace a doctor's diagnosis. If you have concerns about your health, please consult a healthcare provider.";
        break;
      default:
        reviewText +=
          " We couldn't provide specific advice for this prediction. Please consult a doctor for any health concerns.";
        break;
    }
    aiReview.textContent = reviewText;
  } else {
    predictionResult.textContent = 'No clear prediction found.';
    aiReview.textContent =
      'The AI could not confidently classify the image. Please try another image or consult a doctor.';
  }
}
