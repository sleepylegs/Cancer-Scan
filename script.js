const ROBOTFLOW_API_KEY = 'OgC3ItbaT46SvzYTwQAJ';
const MODEL_ID = 'brain-mri-classification-jldfa/1';

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const imageUpload = document.getElementById('imageUpload');
const uploadButton = document.getElementById('uploadButton');
const uploadedImage = document.getElementById('uploadedImage');
const predictionResult = document.getElementById('predictionResult');
const aiReview = document.getElementById('aiReview');
const loadingSpinner = document.getElementById('loadingSpinner');

// Trigger hidden file input on button click
uploadButton.addEventListener('click', () => imageUpload.click());

// Handle file input change
imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

// Drag and Drop Events
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// Convert file to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// File handling
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
    uploadedImage.src = 'data:image/*;base64,' + base64Image;
    uploadedImage.style.display = 'block';

    const prediction = await predictWithRoboflowAPI(base64Image);
    displayPrediction(prediction);
  } catch (error) {
    console.error(error);
    predictionResult.textContent = 'Error: Could not get prediction.';
    aiReview.textContent = 'There was an issue processing the image.';
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

// API Prediction Call
async function predictWithRoboflowAPI(base64Image) {
  const response = await fetch(
    'https://serverless.roboflow.com/infer/workflows/machine-learning-5m6pf/custom-workflow-2',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: ROBOTFLOW_API_KEY, // use your publishable key
        inputs: {
          image: { type: 'base64', value: base64Image },
        },
      }),
    }
  );

  if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
  const prediction = await response.json();
  console.log('Prediction Response:', prediction);
  return prediction;
}

function displayPrediction(prediction) {
  console.log('Raw Prediction:', prediction);

  const output = prediction.outputs && prediction.outputs[0].predictions;
  if (!output || !output.top) {
    predictionResult.textContent = 'No prediction returned.';
    aiReview.textContent = 'The AI could not classify the image.';
    return;
  }

  const predictedClass = output.top;
  const confidence = (output.confidence * 100).toFixed(2);

  predictionResult.innerHTML = `<strong>${predictedClass}</strong> (Confidence: ${confidence}%)`;

  let reviewText =
    'Please consult a medical professional for a definitive diagnosis. This AI prediction is for informational purposes only.';

  switch (predictedClass.toLowerCase()) {
    case 'glioma':
      reviewText += ' Gliomas start in the brain or spinal cord.';
      break;
    case 'meningioma':
      reviewText +=
        ' Meningiomas arise from the membranes surrounding the brain.';
      break;
    case 'pituitary':
      reviewText += ' Pituitary tumors occur in the pituitary gland.';
      break;
    case 'notumor':
      reviewText += ' The scan shows no tumor indication.';
      break;
    default:
      reviewText += ' Unable to provide additional details.';
      break;
  }

  aiReview.textContent = reviewText;
}

function generateAIReview(className) {
  let baseText =
    'Please consult a medical professional for a definitive diagnosis. This AI prediction is for informational purposes only.';

  switch (className.toLowerCase()) {
    case 'glioma':
      return (
        baseText +
        ' Gliomas are tumors originating in the brain or spinal cord. Immediate medical evaluation is recommended.'
      );
    case 'meningioma':
      return (
        baseText +
        ' Meningiomas are usually benign but require medical assessment and possible treatment.'
      );
    case 'pituitary':
      return (
        baseText +
        ' Pituitary tumors can affect hormones and require medical consultation.'
      );
    case 'notumor':
      return (
        baseText +
        " The scan appears normal, but always seek a doctor's opinion if concerned."
      );
    default:
      return baseText;
  }
}
