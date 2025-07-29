const ROBOTFLOW_API_KEY = 'OgC3ItbaT46SvzYTwQAJ';
const MODEL_ID = 'brain-mri-classification-jldfa/1';

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const imageUpload = document.getElementById('imageUpload');
const uploadButton = document.getElementById('uploadButton');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
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
    loadingSpinner.style.display = 'flex';

    // Hide the placeholder content
    uploadPlaceholder.style.display = 'none';

    // Create and add the image element to the upload area
    let uploadedImage = document.getElementById('uploadedImage');
    if (!uploadedImage) {
        uploadedImage = document.createElement('img');
        uploadedImage.id = 'uploadedImage';
        uploadedImage.alt = 'MRI Scan Preview';
        uploadArea.appendChild(uploadedImage);
    }
    
    // Clear any previous prediction
    predictionResult.textContent = '';
    aiReview.textContent = '';

    try {
        const base64Image = await fileToBase64(file);
        uploadedImage.src = 'data:image/*;base64,' + base64Image;

        const prediction = await predictWithRoboflowAPI(base64Image);
        displayPrediction(prediction);
    } catch (error) {
        console.error(error);
        predictionResult.textContent = 'Error: Could not get prediction.';
        aiReview.textContent = 'There was an issue processing the image.';
        // Show placeholder again on error
        uploadedImage.remove();
        uploadPlaceholder.style.display = 'block';
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// API Prediction Call
async function predictWithRoboflowAPI(base64Image) {
    const response = await fetch(
        'https://serverless.roboflow.com/infer/workflows/machine-learning-5m6pf/custom-workflow-2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: ROBOTFLOW_API_KEY,
                inputs: {
                    image: {
                        type: 'base64',
                        value: base64Image
                    },
                },
            }),
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }
    const prediction = await response.json();
    console.log('Prediction Response:', prediction);
    return prediction;
}

function displayPrediction(prediction) {
    console.log('Raw Prediction:', prediction);

    const output = prediction.outputs && prediction.outputs[0].predictions;
    if (!output || !output.top) {
        predictionResult.innerHTML =
            '<span class="error-text">No prediction returned.</span>';
        aiReview.textContent = 'The AI could not classify the image.';
        return;
    }

    const predictedClass = output.top;
    const confidence = (output.confidence * 100).toFixed(1);

    // Update result area with a styled card
    predictionResult.innerHTML = `
        <div class="prediction-card">
            <div class="prediction-class">${predictedClass}</div>
            <div class="confidence-container">
                <span class="confidence-text">Confidence: ${confidence}%</span>
                <div class="confidence-bar-bg">
                    <div class="confidence-bar-fill" style="width: ${confidence}%"></div>
                </div>
            </div>
        </div>
    `;

    aiReview.innerHTML = `<p>${generateAIReview(predictedClass)}</p>`;
}

function generateAIReview(className) {
    const baseNote =
        'Note: This prediction is generated by an AI model and should not replace a professional medical diagnosis. Always consult a certified radiologist or neurospecialist for confirmation.';

    switch (className.toLowerCase()) {
        case 'glioma':
            return `
                <strong>About Glioma:</strong> Gliomas are tumors that originate from glial cells in the brain or spine. They can be slow-growing or aggressive, depending on the grade.
                <br><br>
                <strong>What You Should Do:</strong> Schedule an urgent MRI with contrast and consult a neurologist or oncologist. A biopsy may be recommended to determine tumor type and grade.
                <br><br>
                ${baseNote}
            `;
        case 'meningioma':
            return `
                <strong>About Meningioma:</strong> Meningiomas form on the meninges — the membranes surrounding the brain and spinal cord. Most are benign but may still cause neurological symptoms.
                <br><br>
                <strong>What You Should Do:</strong> Book a neurosurgical consultation. Follow-up imaging or surgical removal might be necessary depending on symptoms and size.
                <br><br>
                ${baseNote}
            `;
        case 'pituitary':
            return `
                <strong>About Pituitary Tumors:</strong> These tumors develop in the pituitary gland and may affect hormonal balance. Most are treatable but can cause vision problems or endocrine issues.
                <br><br>
                <strong>What You Should Do:</strong> Consult an endocrinologist and get a hormonal panel test. Imaging with a contrast MRI of the sella region is recommended.
                <br><br>
                ${baseNote}
            `;
        case 'notumor':
            return `
                <strong>No Tumor Detected:</strong> The scan does not indicate signs of a tumor.
                <br><br>
                <strong>What You Should Do:</strong> If the patient experiences persistent symptoms (e.g., headaches, dizziness, vision changes), seek a doctor’s advice for further evaluation.
                <br><br>
                ${baseNote}
            `;
        default:
            return `
                <strong>Result Unclear:</strong> The AI model could not confidently classify the scan.
                <br><br>
                <strong>Next Steps:</strong> Please upload a clearer MRI scan or seek professional radiological analysis.
                <br><br>
                ${baseNote}
            `;
    }
}