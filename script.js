const ROBOTFLOW_API_KEY = 'rf_dqDbILKhaEMFeRG4AC8EQYkAxl33';
const MODEL_ID = 'brainmri_classification/1';

// Get DOM Elements
const uploadArea = document.getElementById('uploadArea');
const imageUpload = document.getElementById('imageUpload');
const uploadButton = document.getElementById('uploadButton');
const uploadedImage = document.getElementById('uploadedImage');
const imagePreview = document.getElementById('imagePreview');
const predictionResult = document.getElementById('predictionResult');
const aiReview = document.getElementById('aiReview');
const loadingSpinner = document.getElementById('loadingSpinner');

let roboflowModel;

// Initialize Roboflow.js
async function initializeRoboflow() {
  try {
    roboflowModel = await roboflow
      .auth({
        publishable_key: ROBOTFLOW_API_KEY,
      })
      .load({
        model: MODEL_ID,
      });
    console.log('Roboflow model loaded successfully!');
  } catch (error) {
    console.error('Error loading Roboflow model:', error);
    alert(
      'Failed to load AI model. Please try again later or check your network connection.'
    );
  }
}

initializeRoboflow();

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

async function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file (e.g., JPG, PNG).');
    return;
  }

  // Reset previous results
  predictionResult.textContent = 'Analyzing...';
  aiReview.textContent = 'Please wait while the AI processes the image.';
  uploadedImage.style.display = 'none'; // Hide old image
  loadingSpinner.style.display = 'flex'; // Show loading spinner

  const reader = new FileReader();
  reader.onload = async (e) => {
    uploadedImage.src = e.target.result;
    uploadedImage.style.display = 'block'; // Display the uploaded image

    // Wait for image to load in DOM before passing to Roboflow
    uploadedImage.onload = async () => {
      if (roboflowModel) {
        try {
          const prediction = await roboflowModel.classify({
            // Roboflow.js can take an HTML Image element directly
            image: uploadedImage,
          });

          console.log('Prediction Result:', prediction);
          displayPrediction(prediction);
        } catch (error) {
          console.error('Error during prediction:', error);
          predictionResult.textContent = 'Error: Could not get prediction.';
          aiReview.textContent =
            'There was an issue processing the image. Please try again.';
        } finally {
          loadingSpinner.style.display = 'none'; // Hide spinner
        }
      } else {
        console.error('Roboflow model not initialized.');
        predictionResult.textContent = 'Error: AI model not ready.';
        aiReview.textContent =
          'The AI model is still loading or failed to load. Please refresh the page.';
        loadingSpinner.style.display = 'none'; // Hide spinner
      }
    };
  };
  reader.readAsDataURL(file);
}

function displayPrediction(prediction) {
  if (
    prediction &&
    prediction.predictions &&
    prediction.predictions.length > 0
  ) {
    // Find the prediction with the highest confidence
    const bestPrediction = prediction.predictions.reduce((prev, current) =>
      prev.confidence > current.confidence ? prev : current
    );

    const predictedClass = bestPrediction.class;
    const confidence = (bestPrediction.confidence * 100).toFixed(2);

    predictionResult.innerHTML = `<strong>${predictedClass}</strong> (Confidence: ${confidence}%)`;

    // --- AI Review Logic (Customize this for your hackathon!) ---
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
